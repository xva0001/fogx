import "h3"
import { H3Event } from "h3"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "./EncrytionHandler/IncomingEncryptionHandler"
import { IstorySchemaVaildatorRequestObj } from "../request_sheme/story/Istory"
import InvalidError from "../err/InvalidErr"
import { v4 as uuidv4Generate } from "uuid"
import { findStoryByID } from "../dbOperation/findStoryByID"
import { verifyJWT } from "../token_validator/jwt"
import { verifyToken } from "../token_validator/paseto"
import { InsertStory } from "../dbOperation/insertStory"
import { IStory } from "../db_data_schema/StorySchema"
import { isValidImage } from "../utils/checkImage"
import { getUserInfo } from "../dbOperation/getUserInfo"
import RequestEncryption from "~/shared/Request/requestEncrytion"

export const StoryInsertionHandler = async (event:H3Event)=>{

    let shared 
    let decrypted
    const body = await readBody(event)
    try {
        console.log("hi");
        
        decrypted = await IncomingReqEncryptionHandler(event,IstorySchemaVaildatorRequestObj);
        /**
         * extend checking
         * 
         */
        //console.log(decrypted);
        

        if (decrypted.isPublic === true && (decrypted.iv != undefined )) {
            throw createError("iv should not exist")
        }
        if (decrypted.isPublic === false && decrypted.iv == undefined ) {
            throw createError("iv should exist")
        }

        if (decrypted.isPublic === true && decrypted.iv == undefined) {
            //change default 
            decrypted.iv = ""
            let result = await isValidImage(decrypted.image)
            if (result === false) {
                console.log("this is not a image");
                
                throw new Error("this is not a image")
            }
        }

        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError("err on "+ error)
    }

    let jwtPayload 
    let pasetoPayload
    let userUUID :string
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
    let uuid = uuidv4Generate()    
    try {
        await dbConnector.dbConnsOpen(dbNames)

        let countSameUUIDStory = await findStoryByID(dbConnector,uuid)

        if (countSameUUIDStory.counter != 0) {
            throw new Error("same UUID confilct, try again!")
        }

        const newStory :IStory = {
            UUID:uuid,
            UserUUID:userUUID,
            createdDate:new Date(),
            isPublic:decrypted.isPublic,
            iv: (decrypted.isPublic?"":decrypted.iv)!,
            Image:[""],//don't use this 
            objHash:"",
            objSign:""
        }

        console.log("UUID : ",newStory.UUID);
        

        let answer = await InsertStory(dbConnector,newStory,decrypted.image)

        console.log(answer.length);
        

        // return {}

        let response : Record<string,any> = {};
        if (answer["rollback"]!=undefined) {
            response["success"] = false
            response["message"] = "db problem"
        }

        if (answer["success"]!=true) {
            return {response}
        }

        
        let userInfo
        try {
            userInfo = await getUserInfo(dbConnector,userUUID)    
        } catch (error) {
            console.log(error);
            
        }
        
        response = {
            id : uuid,
            username : userInfo?.username,
            //refer path :  composables\Istory.ts
            userImage : userInfo?.icon || userInfo?.username,
            image: decrypted.image
        }

        let encrypted = await RequestEncryption.encryptMessage(JSON.stringify(response),shared)

        return encrypted


    } catch (error) {
        console.log(error);
        
        throw createError({message:"error on conn or error on gener",statusCode: 500 })
    }finally{
        await dbConnector.dbConnsClose()
    }



}