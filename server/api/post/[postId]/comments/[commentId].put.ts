import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr";
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { Post, PostSchema, IPost } from "~/server/db_data_schema/PostSchema";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { getThreshold } from "~/server/utils/getShareSettings";

// Zod schema for the decrypted payload
const UpdateCommentPayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
  content: z.string().min(1).max(1000), // New comment content
});
type TUpdateCommentPayload = z.infer<typeof UpdateCommentPayloadSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();

    const postId = event.context.params?.postId;
    const commentId = event.context.params?.commentId; // Get commentId
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
        const parsedDecrypt = UpdateCommentPayloadSchema.extend({ CUUID: z.string().uuid() }).safeParse(basicPayload);

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

        // Update comment content across databases
        await Promise.all(connections.map(async (conn) => {
            try {
                const PostModel = conn.model<IPost>("post", PostSchema);
                // Use positional operator $ to update the specific comment
                const updateResult = await PostModel.updateOne(
                    // 匹配 Post ID, Comment ID, 並且 Comment 的 userID 必須是當前用戶
                    { UUID: postId, "comments.id": commentId, "comments.userID": userUUID },
                    { $set: { "comments.$.content": decryptedData!.content } } // 更新匹配的那個評論
                );

                if (updateResult.modifiedCount > 0) {
                    updateSuccessCount++;
                 } else {
                    // 檢查是否因為未找到或權限不足導致未修改
                    const exists = await PostModel.exists({ UUID: postId, "comments.id": commentId });
                    if (exists) { // 評論存在但未修改，說明權限問題
                        console.error(`Authorization failed: User ${userUUID} tried to update comment ${commentId}`);
                    } else { // 評論或帖子不存在
                        console.warn(`Comment ${commentId} or Post ${postId} not found in DB ${conn.name}.`);
                    }
                 }
            } catch (dbError) {
                console.error(`Error updating comment in DB ${conn.name}:`, dbError);
            }
        }));

        if (updateSuccessCount < getThreshold()) {
            // Consider rollback or specific error message
            throw new Error("Failed to update comment consistently or authorization failed.");
        }

        const responsePayload = { success: true };
        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return { success: true, iv: encryptedResponseData.iv, encryptedMessage: encryptedResponseData.encryptedMessage };

    } catch (error: any) {
        console.error("!!! Error in [commentId].put.ts:", error);
        if (shared) {
            try {
                // 1. 準備包含錯誤訊息的 payload
                const errorPayload = {
                    success: false, // 明確標識操作失敗
                    message: error.message || "An unexpected error occurred while processing the like request." // 使用捕獲到的錯誤訊息或通用訊息
                };
    
                // 2. 加密錯誤 payload
                const encryptedError = await RequestEncryption.encryptMessage(
                    JSON.stringify(errorPayload),
                    shared // 使用之前計算的共享密鑰
                );
    
                // 3. 返回加密後的錯誤回應
                // 注意：API 本身可能算成功接收並處理了請求（即使內部出錯），
                // 所以外層 success 仍為 true，真正的結果在解密後的內容中。
                // 或者，你可以選擇讓整個 API 返回失敗狀態碼，並返回未加密的錯誤（取決於你的錯誤處理策略）
                // 這裡我們返回加密的錯誤：
                return {
                    success: true, // API 調用本身是成功的（收到了請求並嘗試處理）
                    iv: encryptedError.iv,
                    encryptedMessage: encryptedError.encryptedMessage,
                };
    
            } catch (encryptionError) {
                // 如果連加密錯誤訊息都失敗了
                console.error("Failed to encrypt error response:", encryptionError);
                // 返回一個通用的、未加密的伺服器錯誤
                return createError({
                    statusCode: 500,
                    statusMessage: "Server Error",
                    message: "Failed to process request and encrypt error response." // 提供更具體的內部錯誤訊息
                });
            }
        } else {
            // 如果連 shared key 都沒有（理論上在 try 的開頭就會失敗，但作為防禦性程式碼）
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
