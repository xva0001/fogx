import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { getThreshold } from "~/server/utils/getShareSettings";
import { Icomment, Comment, CommentSchema } from "~/server/db_data_schema/IComment"; // 修改引入
import mongoose from "mongoose"; // 引入 mongoose

const UpdateCommentPayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
  content: z.string().min(1).max(1000), // 新的評論內容
});
type TUpdateCommentPayload = z.infer<typeof UpdateCommentPayloadSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();

    const postId = event.context.params?.postId;
    const commentId = event.context.params?.commentId;
    if (!postId || !commentId) {
        return createError({ statusCode: 400, message: "Post ID or Comment ID is missing." });
    }
    if (!req.success) {
        console.error("Invalid request body structure (outer encryption layer):", req.error);
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
    }

    let shared: string | undefined;
    let decryptedData: TUpdateCommentPayload | undefined;

    try {
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
        const basicPayload = JSON.parse(decrypt);
        const parsedDecrypt = UpdateCommentPayloadSchema.safeParse(basicPayload);

        if (!parsedDecrypt.success) throw new Error("Invalid decrypted data format.");

        const jwtPayload = await verifyJWT(parsedDecrypt.data.jwt);
        const pasetoPayload = await verifyToken(parsedDecrypt.data.paseto);
        if (!jwtPayload || jwtPayload.login !== "completed") throw new Error("Invalid or expired JWT.");
        if (!pasetoPayload || pasetoPayload.login !== "completed") throw new Error("Invalid or expired Paseto token.");

        const userUUID = jwtPayload.CUUID as string;
        decryptedData = { ...parsedDecrypt.data, CUUID: userUUID };

        // --- Database Operation ---
        await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
        const connections = dbConnector.getDbConnections();
        if (connections.length < getThreshold()) throw new Error("Not enough database connections.");

        let updateSuccessCount = 0;

        // 在獨立的 Comment 集合中更新評論
        await Promise.all(connections.map(async (conn) => {
            try {
                const CommentModel = conn.model<Icomment>("Comment", CommentSchema);
                
                // 嘗試將 commentId 轉換為 ObjectId
                let commentObjectId: mongoose.Types.ObjectId;
                try {
                    commentObjectId = new mongoose.Types.ObjectId(commentId);
                } catch (e) {
                    console.error(`Invalid commentId format: ${commentId}`);
                    return; // 跳過此連接的處理
                }
                
                // 更新評論內容，並確保只有擁有者可以更新
                const updateResult = await CommentModel.updateOne({
                    _id: commentObjectId,
                    UserUUID: userUUID,  // 驗證擁有者
                    PostUUID: postId     // 確保評論屬於正確的帖子
                }, { 
                    $set: { content: decryptedData!.content }
                });

                if (updateResult.modifiedCount > 0) {
                    updateSuccessCount++;
                } else {
                    // 檢查評論是否存在但不屬於該用戶
                    const commentExists = await CommentModel.exists({
                        _id: commentObjectId,
                        PostUUID: postId
                    });
                    
                    if (commentExists) {
                        console.error(`Authorization failed: User ${userUUID} tried to update comment ${commentId} that they do not own`);
                    } else {
                        console.warn(`Comment ${commentId} not found in DB ${conn.name}`);
                    }
                }
            } catch (dbError) {
                console.error(`Error updating comment in DB ${conn.name}:`, dbError);
            }
        }));

        if (updateSuccessCount < getThreshold()) {
            throw new Error("Failed to update comment consistently or authorization failed.");
        }

        const responsePayload = { success: true };
        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return { success: true, iv: encryptedResponseData.iv, encryptedMessage: encryptedResponseData.encryptedMessage };

    } catch (error: any) {
        console.error("!!! Error in [commentId].put.ts:", error);
        if (shared) {
            try {
                const errorPayload = {
                    success: false,
                    message: error.message || "An unexpected error occurred while updating the comment."
                };
                const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
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

