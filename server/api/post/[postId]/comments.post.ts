import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { Post, PostSchema, IPost } from "~/server/db_data_schema/PostSchema";
import { Icomment, Comment } from "~/server/db_data_schema/IComment"; // 修改引入
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { getThreshold } from "~/server/utils/getShareSettings";
import Identicon from 'identicon.js';
import pkg from 'js-sha3';
const { sha3_256 } = pkg;
import forge from 'node-forge';

// 定義解密後請求體的 Zod Schema
const AddCommentPayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
  content: z.string().min(1).max(1000),
});
type TAddCommentPayload = z.infer<typeof AddCommentPayloadSchema>;

// 定義返回給前端的評論結構
interface ICommentResponse {
    id: string;
    userID: string;
    username: string;
    icon: string;
    date: Date | string;
    content: string;
}

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    console.log("Request URL:", event.node.req.url);
    console.log("Route params:", event.context.params);
    console.log("Extracted postId:", event.context.params?.postId); // 注意大寫ID

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
    let decryptedData: TAddCommentPayload | undefined;

    try {
        // 解密和驗證請求
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
        const basicPayload = JSON.parse(decrypt);
        const parsedDecrypt = AddCommentPayloadSchema.omit({ CUUID: true }).safeParse(basicPayload);

        if (!parsedDecrypt.success) {
            console.error("Invalid decrypted data structure (inner payload):", parsedDecrypt.error);
            throw new Error("Invalid decrypted data format.");
        }

        // 驗證令牌並獲取 CUUID
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

        // 獲取評論者信息
        let commentingUser: Pick<IUser, 'username' | 'icon' | 'CUUID'> | null = null;
        try {
            const userModel = primaryConn.model<IUser>("user", userSchema);
            commentingUser = await userModel.findOne({ CUUID: userUUID }).select('username icon CUUID').lean();
        } catch (e) { 
            console.error("Failed to fetch commenting user info", e); 
        }

        if (!commentingUser) throw new Error("Could not find commenting user information.");

        // 準備評論數據
        const commentContentToEncrypt = decryptedData.content;
        const commentCreationDate = new Date();

        // 加密評論內容 (臨時使用未加密內容)
        const commentIv = forge.random.getBytesSync(16);
        const encryptedContent = commentContentToEncrypt; // 在實際實現中應加密
        const ivBase64 = forge.util.encode64(commentIv);

        // 建立評論基本數據
        const commentBaseData: Omit<Icomment, '_id' | 'objHash' | 'objSign'> = {
            UserUUID: userUUID,
            PostUUID: postId,
            createdDate: commentCreationDate,
            isPublic: true,
            iv: ivBase64,
            content: encryptedContent,
        };

        // 計算雜湊和簽名 (臨時使用佔位符)
        const calculatedHash = "placeholder_hash_" + Date.now();
        const calculatedSign = "placeholder_sign_" + Date.now();

        // 創建完整評論對象
        const newCommentForDb: Icomment = {
            ...commentBaseData,
            objHash: calculatedHash,
            objSign: calculatedSign,
        };

        // 在所有數據庫中創建評論
        let insertSuccessCount = 0;
        let savedCommentId = '';

        await Promise.all(connections.map(async (conn) => {
            try {
                const CommentModel = conn.model<Icomment>("Comment", Comment.schema);
                const commentResult = await CommentModel.create(newCommentForDb);
                
                if (commentResult && commentResult._id) {
                    if (!savedCommentId && commentResult._id) {
                        savedCommentId = commentResult._id.toString();
                    }
                    insertSuccessCount++;
                }
            } catch (dbError) {
                console.error(`Error adding comment in DB ${conn.name}:`, dbError);
            }
        }));

        if (insertSuccessCount < getThreshold()) {
            throw new Error(`Failed to add comment consistently across databases (Success: ${insertSuccessCount}/${getThreshold()}).`);
        }

        // 準備回應
        const commentForFrontend: ICommentResponse = {
            id: savedCommentId,
            userID: userUUID,
            username: commentingUser.username,
            icon: commentingUser.icon
                ? (commentingUser.icon.startsWith('data:image') ? commentingUser.icon : "data:image/png;base64," + commentingUser.icon)
                : "data:image/png;base64," + new Identicon(sha3_256(commentingUser.username || userUUID), 100).toString(),
            date: commentCreationDate,
            content: commentContentToEncrypt, // 返回未加密內容
        };

        const responsePayload = {
            success: true,
            comment: commentForFrontend
        };

        // 加密回應
        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return {
            success: true,
            iv: encryptedResponseData.iv,
            encryptedMessage: encryptedResponseData.encryptedMessage,
        };

    } catch (error: any) {
        console.error("!!! Error in comments.post.ts:", error);
        
        if (shared) {
            try {
                const errorPayload = {
                    success: false,
                    message: error.message || "An unexpected error occurred while adding comment."
                };
                
                const encryptedError = await RequestEncryption.encryptMessage(
                    JSON.stringify(errorPayload),
                    shared
                );
                
                return {
                    success: true,
                    iv: encryptedError.iv,
                    encryptedMessage: encryptedError.encryptedMessage
                };
            } catch (encryptionError) {
                console.error("Failed to encrypt error response:", encryptionError);
                return createError({
                    statusCode: 500,
                    statusMessage: "Server Error",
                    message: "Failed to process request and encrypt error."
                });
            }
        } else {
            return createError({
                statusCode: 500,
                statusMessage: "Server Error",
                message: error.message || "Failed to process request."
            });
        }
    } finally {
        await dbConnector.dbConnsClose();
    }
});

