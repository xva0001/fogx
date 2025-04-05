import "h3"
import { H3Event } from "h3"
import InvalidError from "~/server/err/InvalidErr"
import { EncryptReqShema } from "~/shared/Request/IEncryptReq"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { calSharedKey } from "~/shared/useKeyFn"
import {z, ZodObject, ZodRawShape} from "zod"


export const IncomingReqEncryptionHandler = async <T extends ZodRawShape>(event:H3Event,  outputShema : ZodObject<T>):
 Promise<z.infer<typeof outputShema>>  =>{
    const body = await readBody(event)
    const req = EncryptReqShema.safeParse(body)
    if (!req.success) {
        throw InvalidError()
    }
    let shared =  calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)
    let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv)
    let output = outputShema.safeParse(JSON.parse(decrypt))
    if (!output.success) {
        throw InvalidError()
    }
    return output.data

}