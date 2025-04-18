import { H3Event } from "h3";
import { IPostUpdateRequest } from "~/server/request_sheme/post/Ipost";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import { updatePost } from "~/server/dbOperation/updatePost";
import { findPostByID } from "~/server/dbOperation/findPostById";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "../../eventHandle/EncrytionHandler/IncomingEncryptionHandler";
import { isValidImage } from "~/server/utils/checkImage";
import { getCorrectPost } from "~/server/DataFixer/PostFixer";
import { IPost } from "~/server/db_data_schema/PostSchema";

export const modifyPostHandler = async (event: H3Event) => {
    let shared;
    let decrypted;
    const body = await readBody(event);
    
    try {
        decrypted = await IncomingReqEncryptionHandler(event, IPostUpdateRequest);

        // Validate encryption fields
        if (decrypted.isPublic === true && decrypted.iv !== undefined) {
            throw createError("iv should not exist for public posts");
        }
        if (decrypted.isPublic === false && decrypted.iv === undefined) {
            throw createError("iv should exist for private posts");
        }

        // Validate images if provided
        if (decrypted.Image) {
            for (const img of decrypted.Image) {
                if (!await isValidImage(img)) {
                    throw new Error("Invalid image data");
                }
            }
        } else {
            decrypted.Image = []; // Set empty array if no images
        }

        shared = GetSharedKeyHandler(body);
    } catch (error) {
        throw createError(`Error in request processing: ${error}`);
    }

    // Verify tokens
    let jwtPayload;
    let pasetoPayload;
    let UserUUID
    try {
        jwtPayload = await verifyJWT(decrypted.jwt);
        pasetoPayload = await verifyToken(decrypted.paseto);

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired JWT");
        }
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired Paseto token");
        }
        UserUUID = jwtPayload.CUUID
    } catch (error) {
        throw createError("Token verification failed");
    }

    const dbConnector = new MongoDBConnector();
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr;

    try {
        await dbConnector.dbConnsOpen(dbNames);
        
        // Find existing post
        const existingPost = await findPostByID(dbConnector, decrypted.postUUID);
        if (existingPost.counter === 0) {
            throw new Error("Post not found");
        }
        const problemArr  :number[] = []
        for (let index = 0; index < existingPost.contents.length; index++) {
            const element = existingPost.contents[index];
            if (element==undefined) {
                problemArr.push(index)
            }            
        }
        // Get original post data
        const originalPost = await getCorrectPost(existingPost.contents,problemArr);

        if (originalPost.UserUUID != UserUUID) {
            throw new Error("user permission error")
        }
        
        // Prepare updated fields
        const updatedFields: Partial<IPost> = {
            //isPublic: decrypted.isPublic,
            //iv: decrypted.iv || "",
            title: [decrypted.title],
            content: [decrypted.content],
            Image: decrypted.Image || [],
            tags: decrypted.tags || []
        };
        // Update post
        const updateResult = await updatePost(
            dbConnector,
            originalPost,
            updatedFields
        );
        if (!updateResult) {
            throw new Error("Failed to update post");
        }
        // Prepare response
        const response = {
            id: decrypted.postUUID,
            status: "updated",
            title: decrypted.title,
            content: decrypted.content,
            images: decrypted.Image,
            tags: decrypted.tags
        };

        let encrypted = await RequestEncryption.encryptMessage(JSON.stringify(response), shared);
        return encrypted;

    } catch (error) {
        console.error("Error in post modification:", error);
        throw createError({
            message: "Error modifying post", 
            statusCode: 500 
        });
    } finally {
        await dbConnector.dbConnsClose();
    }
}

export default defineEventHandler(modifyPostHandler);
