import { model, Schema } from "mongoose";

export interface IMessage {
    sender_UUID : string
    receiver_UUID:string
    iv:string
    encrypted_message  : string[]
    createdDate : Date
    objHash : string
    objSign : string
}


const MessageSchema = new Schema<IMessage>({
    sender_UUID : { type: String, required: true },
    receiver_UUID : { type: String, required: true },
    iv:{type:String, required:true},
    encrypted_message : { type: [String], required: true },
    createdDate : { type: Date, default: Date.now },
    objHash :{ type : String, required: true},
    objSign :{ type : String, required: true},
})
const Message = model<IMessage>("message", MessageSchema, "message")

export default {MessageSchema, Message}
