import pkg from "js-sha3"
import { IMessage } from "../db_data_schema/MessageShema"


const {sha3_256} = pkg

export const sha3_256_messageHash =(message:IMessage)=>{

    const cleanedMessage : IMessage = {
        sender_UUID : message.sender_UUID,
        receiver_UUID : message.receiver_UUID,
        iv : message.iv,
        encrypted_message : message.encrypted_message,
        createdDate : message.createdDate,
        objHash :"",
        objSign:    ""

    }

    const str  = JSON.stringify(cleanedMessage)

    return sha3_256(str)

}