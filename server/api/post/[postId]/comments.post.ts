import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"; // 確保路徑正確
import { EncryptedRes } from "~/shared/Request/IEncryptRes"; // 確保路徑正確
import InvalidError from "~/server/err/InvalidErr"; // 確保路徑正確
import { calSharedKey } from "~/shared/useKeyFn"; // 確保路徑正確
import RequestEncryption from "~/shared/Request/requestEncrytion"; // 確保路徑正確
import { MongoDBConnector } from "~/server/utils/mongodbConn"; // 確保路徑正確
import { Post, PostSchema, IPost } from "~/server/db_data_schema/PostSchema"; // 確保路徑正確
import { Icomment, CommentSchema } from "~/server/db_data_schema/IComment"; // 確保路徑正確
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema"; // 確保路徑正確
import { verifyJWT } from "~/server/token_validator/jwt"; // 確保路徑正確
import { verifyToken } from "~/server/token_validator/paseto"; // 確保路徑正確
import { getThreshold } from "~/server/utils/getShareSettings"; // 確保路徑正確
import mongoose from "mongoose"; // 導入 mongoose for ObjectId
import Identicon from 'identicon.js'; // 導入 Identicon
import pkg from 'js-sha3'; // 使用默認導入
const { sha3_256 } = pkg; // 解構
import { Mutex } from "async-mutex";
import forge from 'node-forge'; // <--- 添加導入 forge
// --- 導入你將創建的工具 ---
// import { sha3_256_commentHash } from '~/server/utils/HashedComment'; // <--- 需要創建和導入
// import SignComment from '~/server/utils/SignComment'; // <--- 需要創建和導入 (或擴展 SignMessage)

// 1. 定義解密後請求體的 Zod Schema
const AddCommentPayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(), // 將在 token 驗證後添加
  content: z.string().min(1).max(1000), // 驗證評論內容長度
});
type TAddCommentPayload = z.infer<typeof AddCommentPayloadSchema>;

// 定義返回給前端的評論結構 (不含敏感信息)
interface ICommentResponse {
    id: string;
    userID: string;
    username: string;
    icon: string;
    date: Date | string;
    content: string; // 返回未加密的內容
}

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    console.log("Request URL:", event.node.req.url);
    console.log("Route params:", event.context.params);
    console.log("Extracted postId:", event.context.params?.postId);

    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();

    console.log("Like API received params:", event.context.params);
    const postId = event.context.params?.postId; // 從路由參數獲取 postId
    if (!postId) {
        // 如果 postId 不存在，直接返回錯誤，無需後續操作
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Post ID is missing." });
    }
    if (!req.success) {
        console.error("Invalid request body structure (outer encryption layer):", req.error);
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
    }

    let shared: string | undefined;
    let decryptedData: TAddCommentPayload | undefined;

    try {
        // 2. 解密和驗證請求
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
        const basicPayload = JSON.parse(decrypt);
        // 驗證基礎 payload，CUUID 稍後從 token 添加
        const parsedDecrypt = AddCommentPayloadSchema.omit({ CUUID: true }).safeParse(basicPayload);

        if (!parsedDecrypt.success) {
            console.error("Invalid decrypted data structure (inner payload):", parsedDecrypt.error);
            throw new Error("Invalid decrypted data format.");
        }

        // 3. 驗證 Token 並獲取 CUUID
        const jwtPayload = await verifyJWT(parsedDecrypt.data.jwt);
        const pasetoPayload = await verifyToken(parsedDecrypt.data.paseto);
        if (!jwtPayload || jwtPayload.login !== "completed") throw new Error("Invalid or expired JWT.");
        if (!pasetoPayload || pasetoPayload.login !== "completed") throw new Error("Invalid or expired Paseto token.");

        const userUUID = jwtPayload.CUUID as string; // 確定用戶身份
        // 將 CUUID 添加到解密數據中
        decryptedData = { ...parsedDecrypt.data, CUUID: userUUID };

        // --- Database Operation ---
        await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
        const connections = dbConnector.getDbConnections();
        if (connections.length < getThreshold()) throw new Error("Not enough database connections.");

        // 獲取評論者信息 (只需要 username 和 icon)
        let commentingUser: Pick<IUser, 'username' | 'icon' | 'CUUID'> | null = null;
        const primaryConn = connections[0];
        try {
            const userModel = primaryConn.model<IUser>("user", userSchema);
            commentingUser = await userModel.findOne({ CUUID: userUUID }).select('username icon CUUID').lean();
        } catch (e) { console.error("Failed to fetch commenting user info", e); }

        if (!commentingUser) throw new Error("Could not find commenting user information.");

        // --- 準備新評論數據 ---
        const commentContentToEncrypt = decryptedData.content;
        const commentCreationDate = new Date();

        // **TODO: 1. 加密評論內容**
        const commentIv = forge.random.getBytesSync(16); // 示例：生成 IV
        // const encryptedContent = await RequestEncryption.encryptContent(commentContentToEncrypt, commentIv, shared); // <--- 替換為實際的加密調用
        const encryptedContent = commentContentToEncrypt; // 臨時：使用未加密內容
        const ivBase64 = forge.util.encode64(commentIv); // 保存 Base64 IV

        // **2. 創建用於計算雜湊和簽名的基礎評論對象**
        const commentBaseData: Omit<Icomment, '_id' | 'objHash' | 'objSign'> = {
            UserUUID: userUUID,
            PostUUID: postId,
            createdDate: commentCreationDate,
            isPublic: true, // 假設默認公開
            iv: ivBase64,
            content: encryptedContent, // 使用加密後的內容
        };

        // **TODO: 3. 計算雜湊 (需要 HashedComment.ts)**
        const calculatedHash = "placeholder_hash_" + Date.now(); // <--- 替換為實際調用: sha3_256_commentHash(commentBaseData);

        // **TODO: 4. 計算簽名 (需要 SignComment.ts 或類似工具)**
        const calculatedSign = "placeholder_sign_" + Date.now(); // <--- 替換為實際調用: await SignComment.sign(...)

        // **5. 創建完整的評論對象 (包含雜湊和簽名)**
        const newCommentForDb: Icomment = {
            ...commentBaseData,
            objHash: calculatedHash,
            objSign: calculatedSign,
        };

        // --- 數據庫操作 ---
        let updateSuccessCount = 0;
        let savedCommentId: mongoose.Types.ObjectId | undefined;

        await Promise.all(connections.map(async (conn) => {
            try {
                const PostModel = conn.model<IPost>("post", PostSchema);
                // 創建包含 Mongoose _id 的對象用於 $push
                const commentToPush = { ...newCommentForDb, _id: new mongoose.Types.ObjectId() };
                if (!savedCommentId) savedCommentId = commentToPush._id; // 保存第一個生成的 ID

                const updateResult = await PostModel.updateOne(
                    { UUID: postId },
                    {
                        $push: { comments: commentToPush },
                        $inc: { commentCount: 1 } // 假設 PostSchema 有 commentCount 字段
                    }
                );
                 if (updateResult.modifiedCount > 0) {
                   updateSuccessCount++;
                } else {
                   console.warn(`Add comment failed or no change for post ${postId} in DB ${conn.name}`);
                   const postExists = await PostModel.exists({ UUID: postId });
                   if (!postExists) {
                       console.error(`Post ${postId} not found in DB ${conn.name}`);
                   }
                }
            } catch (dbError) {
                console.error(`Error adding comment in DB ${conn.name}:`, dbError);
            }
        }));

        if (updateSuccessCount < getThreshold()) {
            // **TODO: 考慮回滾邏輯**
            console.error(`Failed to add comment consistently across databases (Success: ${updateSuccessCount}/${getThreshold()}). Rollback might be needed.`);
            throw new Error("Failed to add comment consistently across databases.");
        }

        // --- 準備成功回應 ---
        const commentForFrontend: ICommentResponse = {
            id: savedCommentId ? savedCommentId.toHexString() : `temp-${Date.now()}`,
            userID: userUUID,
            username: commentingUser.username,
            icon: commentingUser.icon // 使用獲取的評論者頭像
                ? (commentingUser.icon.startsWith('data:image') ? commentingUser.icon : "data:image/png;base64," + commentingUser.icon)
                : "data:image/png;base64," + new Identicon(sha3_256(commentingUser.username || userUUID), 100).toString(),
            date: commentCreationDate,
            content: commentContentToEncrypt, // 返回原始未加密內容
            // 移除 comments 字段
        };

        const responsePayload = {
            success: true,
            comment: commentForFrontend
        };

        // 6. 加密回應
        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return {
            success: true, // API 本身成功
            iv: encryptedResponseData.iv,
            encryptedMessage: encryptedResponseData.encryptedMessage,
        };

    } catch (error: any) {
        console.error("!!! Error in comments.post.ts:", error);
        // 加密錯誤回應
        if (shared) {
            try {
                const errorPayload = { success: false, message: error.message || "An unexpected error occurred while adding comment." };
                const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
                return { success: true, iv: encryptedError.iv, encryptedMessage: encryptedError.encryptedMessage };
            } catch (encryptionError) {
                console.error("Failed to encrypt error response:", encryptionError);
                return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
            }
        } else {
            return createError({ statusCode: 500, statusMessage: "Server Error", data: error.message || "Failed to process request." });
        }
    } finally {
        await dbConnector.dbConnsClose();
    }
});
