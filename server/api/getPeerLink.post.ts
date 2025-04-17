import RequestEncryption from "~/shared/Request/requestEncrytion"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "../eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalTokenSchema } from "../request_sheme/general/generalTokenSchema"
import { verifyJWT } from "../token_validator/jwt"
import { verifyToken } from "../token_validator/paseto"

export default defineEventHandler(async (event) => {



    let shared
    let decrypted

    const body = await readBody(event)

    try {
        decrypted = await IncomingReqEncryptionHandler(event, generalTokenSchema)
        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError("err on (decrypt)" + error)
    }

    let jwtPayload
    let pasetoPayload
    let userUUID: string
    try {

        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired initial JWT.");
        }
        // 檢查 Paseto (假設 verifyToken 成功 = payload，error = null/undefined)
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired initial Paseto token.");
        }

        userUUID = jwtPayload.CUUID as string

    } catch (error) {
        throw createError("TOKEN ERROR!")
    }

    let url = getPeerConfig()
    if (url == null) {
        return {
            message: "No Peer Server enabled"
        }
    }
    let userUrl = {
        host: url.path,
        port: url.port,
        path: url.path
    }

    let response = {
        userUUID: userUUID,
        orgUrlPath: userUrl
    }

    return await RequestEncryption.encryptMessage(JSON.stringify(response), shared)


})