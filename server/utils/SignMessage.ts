import pkg from "js-sha3"
import { IMessage } from "../db_data_schema/MessageShema"
import { sha3_256_messageHash } from "./HashedMessage";
import SignMessage from "~/shared/Request/signMessage";


const { sha3_256 } = pkg


export async function createSignedMessage(
    orgMessage: IMessage,
    shareNum: number,
    threshold: number) {

    const arr_packet: IMessage[] = new Array(shareNum)


    if(!orgMessage.encrypted_message[0]){
        throw new Error("Nothing here");
    }
    

    const sha3_384FororgMsg = sha3_256(orgMessage.encrypted_message[0])

    const parts = await ShaimirStringSplitTool.splitAndShare(orgMessage.encrypted_message[0],shareNum,threshold)

    const q = await ShaimirStringSplitTool.combineShares(parts)

    if (sha3_256(q)!=sha3_384FororgMsg) {
        throw new Error("createSignedMessage : ShamirImageTool : hash result inconsistant")
    }

    let reMsg = groupByIndex_V2(parts).groups

    for (let index = 0; index < shareNum; index++) {
        const db_packet  : IMessage ={
         sender_UUID : orgMessage.sender_UUID,
         receiver_UUID :orgMessage.receiver_UUID,
         iv:orgMessage.iv,
         encrypted_message : reMsg[index],
         createdDate : orgMessage.createdDate,
         objHash:"",
         objSign:""
        }
        let string_packet = JSON.stringify(db_packet)
        let str_hash = sha3_256_messageHash(db_packet)
        db_packet.objHash = str_hash
        try {
            let signObj = await SignMessage.sign(
                process.env.EDDSA_SIGN_PRIVATE_KEY!,
                string_packet           //include sha3_256
            )

            if (signObj.hash != db_packet.objHash) {
                throw new Error("sign Message Error : inconsistant hash")
            }

            db_packet.objSign = signObj.mess


        } catch (error) {
            throw error
        }
        let isValid_sign = SignMessage.verify(
            process.env.EDDSA_SIGN_PUBLIC_KEY!,
            db_packet.objSign,
            String(db_packet.objHash)
        );

        if (!isValid_sign) {
            throw new Error("Signature verification failed");
        }
        arr_packet[index] = db_packet           
    }

    return arr_packet

}