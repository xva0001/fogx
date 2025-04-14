import { IncomingReqEncryptionHandler, GetSharedKeyHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import { MongoDBConnector } from "#imports"
import { deletePostWithRollback } from "~/server/dbOperation/deletePostWithRollback"
import { defineEventHandler, readBody } from "h3"
import { IPostDeleteRequest } from "~/server/request_sheme/post/Ipost"
import RequestEncryption from "~/shared/Request/requestEncrytion"

export default defineEventHandler(async (event) => {
    let decrypted
    let sharedKey
    const body = await readBody(event)

    try {
        decrypted = await IncomingReqEncryptionHandler(event, IPostDeleteRequest)
        sharedKey = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError({ 
            message: "Decryption/Validation failed", 
            statusCode: 400 
        })
    }

    let jwtPayload, pasetoPayload, userUUID
    try {
        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || !pasetoPayload || 
            jwtPayload.login !== "completed" || 
            pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired tokens")
        }

        userUUID = jwtPayload.CUUID as string
    } catch (error) {
        throw createError({ 
            message: "Token validation failed", 
            statusCode: 401 
        })
    }

    const postUUID = decrypted.postUUID
    if (!postUUID) {
        throw createError({ 
            message: "Missing post UUID", 
            statusCode: 400 
        })
    }

    const dbConnector = new MongoDBConnector()
    let success = false
    try {
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr
        await dbConnector.dbConnsOpen(dbNames)
        success = await deletePostWithRollback(dbConnector, postUUID, userUUID)
    } catch (error) {
        console.error("Delete operation failed:", error)
        throw createError({ 
            message: "Failed to process deletion", 
            statusCode: 500 
        })
    } finally {
        await dbConnector.dbConnsClose()
    }

    const responsePayload = { success }
    return responsePayload
})
