import { z } from "zod"

export interface EncryptReq {

    pubkey :string,
    encryptedMessage:string,
    iv :string
}

export const EncryptReqShema = z.object({
    pubkey : z.string(),
    encryptedMessage : z.string(),
    iv : z.string()

})