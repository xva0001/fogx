import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr";
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { Post, PostSchema, IPost } from "~/server/db_data_schema/PostSchema"; // Import Post model
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { getThreshold } from "~/server/utils/getShareSettings"; // Needed if verifying post consistency

// Zod schema for the decrypted payload (only tokens needed)
const LikePayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(), // Include CUUID from token verification
});
type TLikePayload = z.infer<typeof LikePayloadSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    console.log("Request URL:", event.node.req.url);
    console.log("Route params:", event.context.params);
    console.log("Extracted postId:", event.context.params?.postId);

    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();


    console.log("Add Comment API received params:", event.context.params); // <--- 添加日誌 
    // Extract postId from route parameters
    const postId = event.context.params?.postId;
    if (!postId) {
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Post ID is missing." });
    }

    if (!req.success) {
        console.error("Invalid request body structure (outer encryption layer):", req.error);
        return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
    }
    const reqData = req.data;
    let shared: string | undefined;
    let decryptedData: TLikePayload | undefined;

    try {
        shared = calSharedKey(reqData.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(reqData.encryptedMessage, shared, reqData.iv);
        // Add CUUID after parsing basic token payload
        const basicPayload = JSON.parse(decrypt);
        const parsedDecrypt = LikePayloadSchema.extend({ CUUID: z.string().uuid() }).safeParse(basicPayload); // Temporary extend for validation

        if (!parsedDecrypt.success) throw new Error("Invalid decrypted data format.");

        // Verify tokens and extract CUUID *before* assigning to decryptedData
        const jwtPayload = await verifyJWT(parsedDecrypt.data.jwt);
        const pasetoPayload = await verifyToken(parsedDecrypt.data.paseto);
        if (!jwtPayload || jwtPayload.login !== "completed") throw new Error("Invalid or expired JWT.");
        if (!pasetoPayload || pasetoPayload.login !== "completed") throw new Error("Invalid or expired Paseto token.");

        const userUUID = jwtPayload.CUUID as string;
        decryptedData = { ...parsedDecrypt.data, CUUID: userUUID }; // Assign validated data with correct CUUID

        // --- Database Operation ---
        await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
        const connections = dbConnector.getDbConnections();
        if (connections.length < getThreshold()) throw new Error("Not enough database connections.");

        let finalLikesCount = 0;
        let finalIsLiked = false;
        let updateSuccessCount = 0;

        // Perform update across connections (eventual consistency for likes is often acceptable)
        await Promise.all(connections.map(async (conn) => {
            try {
                const PostModel = conn.model<IPost>("post", PostSchema);
                const post = await PostModel.findOne({ UUID: postId }).lean();

                if (!post) {
                    console.warn(`Post ${postId} not found in DB ${conn.name}`);
                    return; // Continue to next connection
                }

                const likes = (post as any)?.likes ?? [];
                if (!Array.isArray(likes)) { /* ... 錯誤處理 ... */ return; }

                const alreadyLiked = likes.includes(userUUID);

                let updateOperation;
                if (alreadyLiked) {
                    // Unlike
                    updateOperation = { $pull: { likes: userUUID }, $inc: { likeCount: -1 } }; // Assuming a likeCount field exists
                    finalIsLiked = false;
                } else {
                    // Like
                    updateOperation = { $addToSet: { likes: userUUID }, $inc: { likeCount: 1 } }; // Use $addToSet to prevent duplicates
                    finalIsLiked = true;
                }

                const updateResult = await PostModel.updateOne({ UUID: postId }, updateOperation);

                if (updateResult.modifiedCount > 0 || (updateResult.matchedCount > 0 && !alreadyLiked === finalIsLiked)) { // Check if update was effective
                   updateSuccessCount++;
                   // Fetch updated count (optional, can be estimated or fetched once)
                   // const updatedPost = await PostModel.findOne({ UUID: postId }).select('likeCount').lean();
                   // finalLikesCount = updatedPost?.likeCount ?? finalLikesCount;
                } else {
                   console.warn(`Like update failed or no change for post ${postId} in DB ${conn.name}`);
                }

            } catch (dbError) {
                console.error(`Error updating like status in DB ${conn.name}:`, dbError);
            }
        }));

        // Check if update succeeded on enough replicas (optional, depends on consistency needs)
        // if (updateSuccessCount < getThreshold()) {
        //     throw new Error("Failed to update like status consistently.");
        // }

        // Fetch the final like count from one reliable source after updates
         const primaryConn = connections[0]; // Or use a designated primary
        const finalPostState = await primaryConn.model<IPost>("post", PostSchema)
                                        .findOne({ UUID: postId })
                                        .select('likes') // 只選擇 likes
                                        .lean();
        finalLikesCount = (finalPostState as any)?.likes?.length ?? 0; // Get count from array length


        // Prepare success response payload
        const responsePayload = {
            success: true,
            likes: finalLikesCount,
            isLiked: finalIsLiked
        };

        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return { success: true, iv: encryptedResponseData.iv, encryptedMessage: encryptedResponseData.encryptedMessage };

    } catch (error: any) {
        console.error("!!! Error in like.post.ts:", error);
        // Encrypt and return error
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
