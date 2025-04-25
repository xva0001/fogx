import { z } from "zod"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"


const AddFriendReqShema = z.object({
    jwt: z.string(),
    paseto : z.string(),
    friendId : z.string().uuid()
})


export default defineEventHandler(async(event)=>{


 let shared
    let decrypted

    const body = await readBody(event)

    try {


        decrypted = await IncomingReqEncryptionHandler(event, AddFriendReqShema)

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

    
    const dbConnector = new MongoDBConnector()
    
    const dbNames = useAppConfig(event).db.conntion.conn_string_env_arr;

    try {
        
        await dbConnector.dbConnsOpen(dbNames)

        let res = await getUserInfo(dbConnector,decrypted.friendId)

        if (!res) {
            return {
                success : false,
                message : "user not found"
            }
        }

        let resp = {
            id: decrypted.friendId,
        name: res.username,
        icon: res.username,
        online: false,
        lastMessage: '',
        time: ''
        }
        
        return await RequestEncryption.encryptMessage(JSON.stringify(resp),shared)


    } catch (error) {
        
    }finally{
        await dbConnector.dbConnsClose()
    }



})