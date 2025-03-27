import pkg from "js-sha3"
import { IUser, IUser_Hash } from "../db_data_schema/UserSchema"

const {sha3_256} = pkg


export const sha3_256_userHash = (obj:IUser)=>{
    const cleanPacket : IUser_Hash = {
        CUUID : obj.CUUID,
        Email : obj.Email,
        sha3_256:obj.sha3_256,
        sha3_384:obj.sha3_384,
        createdDate:obj.createdDate,
        lastestLoginDate:obj.lastestLoginDate,
        keyOf2FA:obj.keyOf2FA,
        backupCode:obj.backupCode,
        username:obj.username,
        objHash:"",
        objSign:""
    }
    return sha3_256(JSON.stringify(cleanPacket))
}