import { IUser } from "../db_data_schema/UserSchema";

class verifyPacket{

    static verifyHashUserPacket(data:IUser,userHash:string):boolean{

        let orgHash = sha3_256_userHash(data)
        if (!(orgHash==userHash)) {
            console.log("Hash inconsistant from verifyPacket. verifyHashUserPacket")
            return false
        }else{
            return true
        }
    }
}