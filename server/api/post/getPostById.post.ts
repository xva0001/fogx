// /server/api/post/getPostById.post.ts

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
import { findPostByID } from "~/server/dbOperation/findPostById"; // Import your function
import { getCorrectPost } from "~/server/DataFixer/PostFixer"; // Import fixer
import { getUserInfo } from "~/server/dbOperation/getUserInfo"; // Import user info fetcher
import { IPost } from "~/server/db_data_schema/PostSchema";
import { Icomment, Comment } from "~/server/db_data_schema/IComment";
import { ILike, Like } from "~/server/db_data_schema/ILike";
import { IUser, userSchema } from "~/server/db_data_schema/UserSchema";
import Identicon from 'identicon.js';
import pkg from 'js-sha3';
const { sha3_256 } = pkg;
import mongoose from 'mongoose';

// Define the expected decrypted payload structure
const GetPostByIdPayloadSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  postUUID: z.string().uuid(), // Expecting the post UUID
});
type TGetPostByIdPayload = z.infer<typeof GetPostByIdPayloadSchema>;

// Define the response structure for a single post (similar to IPost_resp in userPostGet)
interface ICommentResponse { id: string; userID: string; username: string; icon: string; date: Date | string; content: string; }
interface IPostDetailResponse {
    id: string; icon: string; username: string; userID: string; date: Date; title: string; content: string;
    images: string[]; tags: string[]; likes: number; commentCount: number; isLiked: boolean;
    comments: ICommentResponse[];
}

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();

    if (!req.success) {
        return createError({ statusCode: 400, message: "Invalid request structure." });
    }

    let shared: string | undefined;
    let decryptedData: TGetPostByIdPayload | undefined;

    try {
        // Decrypt and Validate Request
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) throw new Error("Failed to calculate shared key.");

        const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
        const basicPayload = JSON.parse(decrypt); 

        console.log("--- Decrypted Payload Received by API ---");
        console.log(basicPayload);                           
        console.log("--- End Decrypted Payload ---"); 

        const parsedDecrypt = GetPostByIdPayloadSchema.safeParse(JSON.parse(decrypt));
        if (!parsedDecrypt.success) {
            console.error("Zod Validation Failed!");
            console.error("Validation Errors:", parsedDecrypt.error.format());
            throw new Error("Invalid decrypted data format.");
        }
        decryptedData = parsedDecrypt.data;

        // Verify Tokens
        const jwtPayload = await verifyJWT(decryptedData.jwt);
        const pasetoPayload = await verifyToken(decryptedData.paseto);
        if (!jwtPayload || jwtPayload.login !== "completed") throw new Error("Invalid or expired JWT.");
        if (!pasetoPayload || pasetoPayload.login !== "completed") throw new Error("Invalid or expired Paseto token.");
        const requestingUserUUID: string = jwtPayload.CUUID as string; // UUID of the user making the request

        // --- Database Operations ---
        await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
        const connections = dbConnector.getDbConnections();
        if (connections.length === 0) throw new Error("No database connections available."); // Check for zero connections

        // 1. Find the post using your function
        const { contents: postContents, counter: postCounter, problemInt: postProblemInt } = await findPostByID(dbConnector, decryptedData.postUUID);

        // 2. Check if the post meets the threshold
        if (postCounter < getThreshold()) {
            throw createError({ statusCode: 404, message: "Post not found or inconsistent." });
        }

        // 3. Get the corrected post data
        const validPosts = postContents.filter(p => p !== undefined) as IPost[]; // Filter out undefined
        const correctPost: IPost = await getCorrectPost(validPosts, postProblemInt);

        // --- Fetch Related Data (using the first connection for simplicity) ---
        const primaryConn = connections[0];
        const LikeModel = primaryConn.model<ILike>('Like', Like.schema);
        const CommentModel = primaryConn.model<Icomment>('Comment', Comment.schema);
        const UserModel = primaryConn.model<IUser>('user', userSchema);

        // 4. Fetch Likes
        const likesForPost = await LikeModel.find({ PostUUID: correctPost.UUID }).lean();
        const isLiked = likesForPost.some(like => like.UserUUID === requestingUserUUID);
        const likesCount = likesForPost.length;

        // 5. Fetch Comments
        const commentsForPost = await CommentModel.find({ PostUUID: correctPost.UUID, isPublic: true })
                                        .sort({ createdDate: -1 })
                                        .lean();

        // 6. Fetch Commenter Info and Format Comments
        const commentsForFrontend: ICommentResponse[] = await Promise.all(commentsForPost.map(async dbComment => {
            let commenterInfo: Pick<IUser, 'username' | 'icon' | 'CUUID'> | null = null;
            try {
                commenterInfo = await UserModel.findOne({ CUUID: dbComment.UserUUID }).select('username icon CUUID').lean();
            } catch (e) { console.error(`Failed to fetch info for commenter ${dbComment.UserUUID}`, e); }

            let commentIdString: string;
            // Robust ID handling (same as in userPostGet)
            if (dbComment._id) {
                if (typeof dbComment._id === 'string') commentIdString = dbComment._id;
                else if (typeof dbComment._id === 'object' && dbComment._id !== null && typeof (dbComment._id as any).toHexString === 'function') commentIdString = (dbComment._id as mongoose.Types.ObjectId).toHexString();
                else { console.warn("Unexpected type for dbComment._id:", typeof dbComment._id); commentIdString = `err-${Date.now()}`; }
            } else { console.warn("dbComment._id is missing"); commentIdString = `missing-${Date.now()}`; }

            return {
                id: commentIdString,
                userID: dbComment.UserUUID,
                username: commenterInfo?.username || 'Unknown',
                icon: commenterInfo?.icon
                    ? (commenterInfo.icon.startsWith('data:image') ? commenterInfo.icon : "data:image/png;base64," + commenterInfo.icon)
                    : "data:image/png;base64," + new Identicon(sha3_256(commenterInfo?.username || dbComment.UserUUID), 100).toString(),
                date: dbComment.createdDate,
                content: dbComment.content // Assuming content is not encrypted or decrypted elsewhere
            };
        }));

        // 7. Fetch Post Author Info
        const postUser = await getUserInfo(dbConnector, correctPost.UserUUID);
        if (!postUser) {
            // Decide how to handle missing author: error or default values
            console.warn(`Author info not found for UserUUID: ${correctPost.UserUUID}`);
            // throw createError({ statusCode: 404, message: "Post author not found." });
        }

        // 8. Format the final response payload
        const responsePayload: { success: boolean; post: IPostDetailResponse } = {
            success: true,
            post: {
                id: correctPost.UUID,
                icon: postUser?.icon
                    ? (postUser.icon.startsWith('data:image') ? postUser.icon : "data:image/png;base64," + postUser.icon)
                    : "data:image/png;base64," + new Identicon(sha3_256(postUser?.username || correctPost.UserUUID), 100).toString(),
                username: postUser?.username || `Unknown User`,
                userID: correctPost.UserUUID,
                date: correctPost.createdDate,
                title: correctPost.title?.[0] || "Untitled", // Assuming title is array
                content: correctPost.content?.[0] || "",   // Assuming content is array
                images: correctPost.Image || [],
                tags: correctPost.tags || [],
                likes: likesCount,
                commentCount: commentsForPost.length,
                isLiked: isLiked,
                comments: commentsForFrontend,
                // Add default frontend states if needed by UserPost interface in frontend
                //showComments: false,
                //newComment: '',
            }
        };

        // 9. Encrypt and Return Response
        const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
        return {
            success: true,
            iv: encryptedResponseData.iv,
            encryptedMessage: encryptedResponseData.encryptedMessage,
        };

    } catch (error: any) {
        console.error("!!! Error in getPostById API:", error);
        const statusCode = error.statusCode || 500;
        const message = error.message || "Failed to fetch post details.";
        // Encrypt error response if possible
        if (shared) {
            try {
                const errorPayload = { success: false, message: message };
                const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
                // Return encrypted error, but outer success is true because API processed the request
                return { success: true, iv: encryptedError.iv, encryptedMessage: encryptedError.encryptedMessage };
            } catch (encryptionError) {
                console.error("Failed to encrypt error response:", encryptionError);
                // Fallback to unencrypted error
                return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
            }
        } else {
            // Cannot encrypt error
            return createError({ statusCode: statusCode, statusMessage: "Server Error", data: message });
        }
    } finally {
        await dbConnector.dbConnsClose();
    }
});
