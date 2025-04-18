import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { Post, PostSchema, IPost } from "~/server/db_data_schema/PostSchema";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { getThreshold } from "~/server/utils/getShareSettings";
import { ILike, Like } from "~/server/db_data_schema/ILike"; // 引入 ILike 模型

// Zod schema for the decrypted payload
const LikePayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
});
type TLikePayload = z.infer<typeof LikePayloadSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    console.log("Request URL:", event.node.req.url);
    console.log("Route params:", event.context.params);
    console.log("Extracted postId:", event.context.params?.postId);

    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();

    // 獲取 postID (注意這裡是大寫 ID)
    const postId = event.context.params?.postId;
    if (!postId) {
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Post ID is missing." });
    }

    if (!req.success) {
        console.error("Invalid request body structure:", req.error);
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
    }

    let shared: string | undefined;
    let decryptedData: TLikePayload | undefined;

    try {
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
        const basicPayload = JSON.parse(decrypt);
        const parsedDecrypt = LikePayloadSchema.extend({ CUUID: z.string().uuid() }).safeParse(basicPayload);

        if (!parsedDecrypt.success) throw new Error("Invalid decrypted data format.");

        // 驗證令牌
        const jwtPayload = await verifyJWT(parsedDecrypt.data.jwt);
        const pasetoPayload = await verifyToken(parsedDecrypt.data.paseto);
        if (!jwtPayload || jwtPayload.login !== "completed") throw new Error("Invalid or expired JWT.");
        if (!pasetoPayload || pasetoPayload.login !== "completed") throw new Error("Invalid or expired Paseto token.");

        const userUUID = jwtPayload.CUUID as string;
        decryptedData = { ...parsedDecrypt.data, CUUID: userUUID };

        // 連接數據庫
        await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
        const connections = dbConnector.getDbConnections();
        if (connections.length < getThreshold()) throw new Error("Not enough database connections.");

        // 驗證帖子存在
        const primaryConn = connections[0];
        const PostModel = primaryConn.model<IPost>("post", PostSchema);
        const postExists = await PostModel.exists({ UUID: postId });
        if (!postExists) throw new Error(`Post ${postId} not found.`);

        let finalLikesCount = 0;
        let finalIsLiked = false;
        let updateSuccessCount = 0;

        // 查詢是否已點讚
        const LikeModel = primaryConn.model<ILike>("Like", Like.schema);
        const existingLike = await LikeModel.findOne({ 
            PostUUID: postId, 
            UserUUID: userUUID 
        }).lean();

        // 決定操作：移除現有點讚或添加新點讚
        if (existingLike) {
            // 取消點讚 - 從所有數據庫中刪除
            await Promise.all(connections.map(async (conn) => {
                try {
                    const LikeModelConn = conn.model<ILike>("Like", Like.schema);
                    const deleteResult = await LikeModelConn.deleteOne({ 
                        PostUUID: postId, 
                        UserUUID: userUUID 
                    });
                    
                    if (deleteResult.deletedCount > 0) {
                        updateSuccessCount++;
                    }
                } catch (dbError) {
                    console.error(`Error removing like in DB ${conn.name}:`, dbError);
                }
            }));
            
            finalIsLiked = false;
        } else {
            // 添加點讚 - 在所有數據庫中創建
            const newLike: ILike = {
                PostUUID: postId,
                UserUUID: userUUID,
                createdDate: new Date()
            };
            
            await Promise.all(connections.map(async (conn) => {
                try {
                    const LikeModelConn = conn.model<ILike>("Like", Like.schema);
                    const createResult = await LikeModelConn.create(newLike);
                    
                    if (createResult) {
                        updateSuccessCount++;
                    }
                } catch (dbError) {
                    // 可能因為唯一索引約束失敗（已經存在），這不算錯誤
                    if (typeof dbError === 'object' && dbError !== null && 'code' in dbError) {
                        // 現在可以安全地訪問 dbError.code
                        if ((dbError as any).code !== 11000) { // 使用類型斷言 (any) 或更具體的類型
                            console.error(`Error adding like in DB ${conn.name}:`, dbError);
                        } else {
                            // 唯一索引約束失敗，表示點讚已存在，算作成功
                            updateSuccessCount++;
                        }
                    } else {
                        // 如果錯誤不是預期的格式，則直接打印錯誤
                        console.error(`Unexpected error adding like in DB ${conn.name}:`, dbError);
                    }
                }
            }));
            
            finalIsLiked = true;
        }

        // 檢查操作是否成功
        if (updateSuccessCount < getThreshold()) {
            throw new Error(`Failed to update like status consistently (${updateSuccessCount}/${getThreshold()}).`);
        }

        // 獲取最終點讚計數
        finalLikesCount = await LikeModel.countDocuments({ PostUUID: postId });

        // 準備加密回應
        const responsePayload = {
            success: true,
            likes: finalLikesCount,
            isLiked: finalIsLiked
        };

        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return { 
            success: true, 
            iv: encryptedResponseData.iv, 
            encryptedMessage: encryptedResponseData.encryptedMessage 
        };

    } catch (error: any) {
        console.error("!!! Error in like.post.ts:", error);
        
        if (shared) {
            try {
                const errorPayload = {
                    success: false,
                    message: error.message || "An unexpected error occurred while processing the like request."
                };
                
                const encryptedError = await RequestEncryption.encryptMessage(
                    JSON.stringify(errorPayload),
                    shared
                );
                
                return {
                    success: true,
                    iv: encryptedError.iv,
                    encryptedMessage: encryptedError.encryptedMessage,
                };
            } catch (encryptionError) {
                console.error("Failed to encrypt error response:", encryptionError);
                return createError({
                    statusCode: 500,
                    statusMessage: "Server Error",
                    message: "Failed to process request and encrypt error response."
                });
            }
        } else {
            console.error("Shared key is missing, cannot encrypt error response.");
            return createError({
                statusCode: 500,
                statusMessage: "Server Error",
                message: error.message || "Failed to process request due to missing shared key."
            });
        }
    } finally {
        await dbConnector.dbConnsClose();
    }
});

