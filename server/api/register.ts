import EC from "elliptic"
import InvalidError from "../err/InvalidErr"
import { ICreateAccountSchemaVaildatorRequestObj } from "../request_sheme/register/ICreateAccount"
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"
import { calSharedKey } from "~/shared/useKeyFn"
import RequestEncryption from "~/shared/Request/requestEncrytion"


export default defineEventHandler(async(event)=>{




    const body = await readBody(event)

    console.log(body);
    

    const req = EncryptReqShema.safeParse(body)

    if (!req.success) {

        return InvalidError()
    }

    try {
        
        let shared = calSharedKey(req.data.pubkey,process.env.ECC_PRIVATE_KEY!)
        console.log(shared);

        let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage,shared,req.data.iv)

        console.log(decrypt);
        

        let d_rq :any = ICreateAccountSchemaVaildatorRequestObj.parse(JSON.parse(decrypt))
        d_rq = ICreateAccountSchemaVaildatorRequestObj.safeParse(JSON.parse(decrypt))

        if (!d_rq.success) {
            return InvalidError()
        }
        console.log(d_rq.data);
        
        
        return {good: "good"}



    } catch (error) {

        console.log(error);
        
        return {good: "bad"}
    }
})