import pkg from "js-sha3"
import { IUserKey } from "../db_data_schema/UserKeyShema"

const {sha3_256} = pkg

export const sha3_256_userKeyHash = (userKey: IUserKey)=>{

    const cleanKeyObj :IUserKey ={
        UUID :userKey.UUID,
        pubkey : userKey.pubkey,
        privateKeyHash : userKey.privateKeyHash,
        createdDate :userKey.createdDate,
        objHash:"",
        objSign:""
    }

    const str = JSON.stringify(cleanKeyObj)

    return sha3_256(str)

}