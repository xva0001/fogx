import { H3Event } from "h3"
import { IpostSchemaVaildatorRequestObj, IpostSchemaVaildatorRequestObjPrivate } from "~/server/request_sheme/post/Ipost"
import { v4 as uuidv4Generate } from "uuid"
import { findPostByID } from "~/server/dbOperation/findPostById"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import { insertPost } from "~/server/dbOperation/insertPost"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { isValidImage } from "~/server/utils/checkImage"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "../EncrytionHandler/IncomingEncryptionHandler"



export const createPrivate = async(event: H3Event)=>{
    let shared 
    let decrypted
    const body = await readBody(event)
    
    try {
        decrypted = await IncomingReqEncryptionHandler(event, IpostSchemaVaildatorRequestObjPrivate);

        // Validate encryption fields
        if (decrypted.isPublic === true && decrypted.iv !== undefined) {
            throw createError("iv should not exist for public posts")
        }
        if (decrypted.isPublic === false && decrypted.iv === undefined) {
            throw createError("iv should exist for private posts")
        }

        

        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError(`Error in request processing: ${error}`)
    }

    // Verify tokens
    let jwtPayload 
    let pasetoPayload
    let userUUID: string
    try {
        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired JWT")
        }
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired Paseto token")
        }

        userUUID = jwtPayload.CUUID as string
    } catch (error) {
        throw createError("Token verification failed")
    }

    const dbConnector = new MongoDBConnector()
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr
    let uuid = uuidv4Generate()

    try {
        await dbConnector.dbConnsOpen(dbNames)
        // Check for UUID conflict
        let countSameUUIDPost = await findPostByID(dbConnector, uuid)
        if (countSameUUIDPost.counter != 0) {
            throw new Error("UUID conflict, please try again")
        }

        // Create and insert post
        const newPost = {
            UUID: uuid,
            UserUUID: userUUID,
            isPublic: decrypted.isPublic,
            iv: decrypted.isPublic ? "" : decrypted.iv!,
            title: decrypted.title,
            content: decrypted.content,
            Image: decrypted.Image?[decrypted.Image] : [],
            tags: decrypted.tags || []
        }

        let insertResult = await insertPost(dbConnector, newPost)

        if (insertResult["success"] === false) {
            throw new Error("Insert Problem (db)")
        }

        // Get user info for response
        let userInfo
        try {
            userInfo = await getUserInfo(dbConnector, userUUID)    
        } catch (error) {
            console.error("Error getting user info:", error)
        }


        const response = {
            id: uuid,
            username: userInfo?.username,
            userImage: userInfo?.icon || userInfo?.username,
            title: decrypted.title,
            content: decrypted.content,
            images: decrypted.Image,
            tags: decrypted.tags
        }

        let encrypted = await RequestEncryption.encryptMessage(JSON.stringify(response), shared)
        return encrypted

    } catch (error) {
        console.error("Error in post creation:", error)
        throw createError({
            message: "Error creating post", 
            statusCode: 500 
        })
    } finally {
        await dbConnector.dbConnsClose()
    }
}



export const createPostHandler = async (event: H3Event) => {
    let shared 
    let decrypted
    const body = await readBody(event)
    
    try {
        decrypted = await IncomingReqEncryptionHandler(event, IpostSchemaVaildatorRequestObj);

        // Validate encryption fields
        if (decrypted.isPublic === true && decrypted.iv !== undefined) {
            throw createError("iv should not exist for public posts")
        }
        if (decrypted.isPublic === false && decrypted.iv === undefined) {
            throw createError("iv should exist for private posts")
        }

        // Validate images if provided
        if (decrypted.Image) {
            for (const img of decrypted.Image) {
                if (!await isValidImage(img)) {
                    throw new Error("Invalid image data")
                }
            }
        } else {
            decrypted.Image = [] // Set empty array if no images
        }

        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError(`Error in request processing: ${error}`)
    }

    // Verify tokens
    let jwtPayload 
    let pasetoPayload
    let userUUID: string
    try {
        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired JWT")
        }
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired Paseto token")
        }

        userUUID = jwtPayload.CUUID as string
    } catch (error) {
        throw createError("Token verification failed")
    }

    const dbConnector = new MongoDBConnector()
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr
    let uuid = uuidv4Generate()

    try {
        await dbConnector.dbConnsOpen(dbNames)
        // Check for UUID conflict
        let countSameUUIDPost = await findPostByID(dbConnector, uuid)
        if (countSameUUIDPost.counter != 0) {
            throw new Error("UUID conflict, please try again")
        }

        // Create and insert post
        const newPost = {
            UUID: uuid,
            UserUUID: userUUID,
            isPublic: decrypted.isPublic,
            iv: decrypted.isPublic ? "" : decrypted.iv!,
            title: decrypted.title,
            content: decrypted.content,
            Image: decrypted.Image,
            tags: decrypted.tags || []
        }

        let insertResult = await insertPost(dbConnector, newPost)

        if (insertResult["success"] === false) {
            throw new Error("Insert Problem (db)")
        }

        // Get user info for response
        let userInfo
        try {
            userInfo = await getUserInfo(dbConnector, userUUID)    
        } catch (error) {
            console.error("Error getting user info:", error)
        }


        const response = {
            id: uuid,
            username: userInfo?.username,
            userImage: userInfo?.icon || userInfo?.username,
            title: decrypted.title,
            content: decrypted.content,
            images: decrypted.Image,
            tags: decrypted.tags
        }

        let encrypted = await RequestEncryption.encryptMessage(JSON.stringify(response), shared)
        return encrypted

    } catch (error) {
        console.error("Error in post creation:", error)
        throw createError({
            message: "Error creating post", 
            statusCode: 500 
        })
    } finally {
        await dbConnector.dbConnsClose()
    }
}
