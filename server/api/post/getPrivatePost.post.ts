import { getCorrectPost } from "~/server/DataFixer/PostFixer"
import { findPostByID } from "~/server/dbOperation/findPostById"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalPostStorySchema } from "~/server/request_sheme/general/generalTokenSchema"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"


export default defineEventHandler(async(event)=>{

    let shared
    let decrypted

    const body = await readBody(event)

    try {


        decrypted = await IncomingReqEncryptionHandler(event, generalPostStorySchema)

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

        let res = await findPostByID(dbConnector,decrypted.postUUID)

        if (res.counter< getThreshold()) {
            return {
                success : false,
                message : "data modified without permission, no data here"
            }
        }        

        let orgPost = await getCorrectPost(res.contents,res.problemInt)
        let tryDecryptTitle 
        let re
        try {
            
            tryDecryptTitle = await RequestEncryption.decryptMessage(orgPost.title[0],decrypted.password,orgPost.iv)

            re = {
                id : orgPost.UUID,
                username: "",
                userID: orgPost.UserUUID,
                icon: "",
                title: tryDecryptTitle,
                content: await RequestEncryption.decryptMessage(orgPost.content[0],decrypted.password,orgPost.iv),
                images: JSON.parse(await RequestEncryption.decryptMessage(orgPost.Image[0],decrypted.password,orgPost.iv)),
                tags: orgPost.tags || [],
                date: new Date(orgPost.createdDate || Date.now())
            }

        } catch (error) {
            return {
                success : false,
                message : "password not correct"
            }
        }

        try {
            
            let userInfo = await getUserInfo(dbConnector,orgPost.UserUUID)
            if (!userInfo) {
                throw createError({message:"user don't exists, but story here (account deleted)"})                
            }
            re.username = userInfo.username
            re.icon = userInfo.icon || userInfo.username
        } catch (error) {
            
        }

        let enc :any = await RequestEncryption.encryptMessage(JSON.stringify(re),shared)
        enc.success = true
        return enc

    } catch (error) {
        console.log(error);
        return{
            success : false
        }
        
    }finally{
        await dbConnector.dbConnsClose()
    }

})