import { getCorrectStory } from "~/server/DataFixer/StoryFixer"
import { deleteOver24HStory } from "~/server/dbOperation/deleteOver24HStory"
import { findStoryByID } from "~/server/dbOperation/findStoryByID"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalPostStorySchema } from "~/server/request_sheme/general/generalTokenSchema"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { IStory_resp } from "./IStory_resp"
import consola from "consola"

const logger = consola.withTag("defineEventHandler")

export default defineEventHandler(async (event) => {

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
    
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr;

    try {
        
        await dbConnector.dbConnsOpen(dbNames)

        await deleteOver24HStory(dbConnector)

        let res = await findStoryByID(dbConnector,decrypted.postUUID)

        if (res.counter < getThreshold()) {
            return {
                success : false,
                message : "data modified without permission, no data here"
            }
        }

        //logger.info(res.contents[0])

        let orgStory = await getCorrectStory(res.contents,res.problemInt)
        let ans : string
        try {
            
            ans = await RequestEncryption.decryptMessage(orgStory.Image[0],decrypted.password,orgStory.iv)

        } catch (error) {
            return{
                success : false,
                message : "password not correct"
            }
        }
        let userInfo = await getUserInfo(dbConnector,orgStory.UserUUID)

        if (!userInfo) {
            throw createError({message:"user don't exists, but story here (account deleted)"})
        }
        let re : IStory_resp = {
            id : orgStory.UUID,
            username : userInfo.username,
            userImage :userInfo.icon||userInfo.username,
            image : ans
        }
        let enc :any = await RequestEncryption.encryptMessage(JSON.stringify(re),shared)
        enc.success = true
        return enc

    } catch (error) {
        console.log(error);
        
    }finally{
        await dbConnector.dbConnsClose()
        
    }



})