import { getCorrectStory } from "~/server/DataFixer/StoryFixer"
import { findPublicStory } from "~/server/dbOperation/findPublicStory"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalTokenSchema } from "~/server/request_sheme/general/generalTokenSchema"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"

interface IStory_resp {
    id : string|number;
    username : string;
    userImage : string;
    image : string;   
   }

export default defineEventHandler(async (event)=>{

let shared 
let decrypted 

const body = await readBody(event)

    try {
        

        decrypted = await IncomingReqEncryptionHandler(event,generalTokenSchema)

        shared = GetSharedKeyHandler(body)

    } catch (error) {
        throw createError("err on (decrypt)" + error)
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
    try {
        await dbConnector.dbConnsOpen(dbNames)
        let res = await findPublicStory(dbConnector)
        let story = []
        for (let index = 0; index < res.length; index++) {
            const element = res[index];
            let porblemArr = []
            for (let index = 0; index < element.length; index++) {
                const sharePart = element[index];
                if (sharePart===undefined) {
                    porblemArr.push(index)
                }
            }
            story.push(await getCorrectStory(element,porblemArr))
        }

        let arr_story_resp  : IStory_resp[] = []
        let problemInt : number[] = []
        for (let index = 0; index < story.length; index++) {
            const item = story[index];
            const user = await getUserInfo(dbConnector,item.UserUUID)
            if (user==null) {
                problemInt.push(index)
                continue
            }
            const newItem : IStory_resp = {
                id : item.UUID,
                username : user.username,
                userImage: user.icon || user.username,
                image : item.Image[0]
                
            }
            arr_story_resp.push(newItem)
        }

        //make a correct respon for front end
        //todo : ^

        let response = await RequestEncryption.encryptMessage(JSON.stringify(arr_story_resp),shared)
        return response        

    } catch (error) {
        console.log(error);
        
        return {
            success : false,

        }
    }finally{
        await dbConnector.dbConnsClose()
    }

})