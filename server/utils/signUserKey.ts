import { secrets } from "easy-shamir-secret-sharing";
import { IUserKey } from "../db_data_schema/UserKeyShema";
import { sha3_256_userKeyHash } from "./HashedUserKey";
import SignMessage from "~/shared/Request/signMessage";

export const createSignedUserKey = async (
    userKey: IUserKey,
    shareNum: number,
    threshold: number) => {
    const arr_packet: IUserKey[] = new Array(shareNum)
    


    const splitedKey = await secrets.share(userKey.pubkey,shareNum,threshold)
    const splitedPrivateHash = await secrets.share(userKey.privateKeyHash,shareNum,threshold)




    for (let index = 0 ; index < shareNum ;index++) {
        const splitedKeyItem = splitedKey[index]

        const splitedPrivateHashItem = splitedPrivateHash[index] 
        
        const db_packet : IUserKey={
            UUID : userKey.UUID,
            pubkey : splitedKeyItem,
            privateKeyHash : splitedPrivateHashItem,
            createdDate : userKey.createdDate,
            objHash : "",
            objSign :""            
        }
        let string_packet = JSON.stringify(db_packet)
        let str_hash = sha3_256_userKeyHash(db_packet)
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