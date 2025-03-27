import pkg from "js-sha3"
import SignMessage from "~/shared/Request/signMessage";
import { IUser, IUser_Hash } from "../db_data_schema/UserSchema";
import { ICreateAccountSchemaVaildatorRequestObj } from "../request_sheme/register/ICreateAccount";
import { sha3_256_userHash } from "./HashedUser";




const {sha3_256} = pkg


export async function createSignedPackets(
    uuid: string,
    email: string,
    sha3_256_password: string,
    sha3_384_password: string,
    backupCodes: string[],
    username: string,
    share_arr_for_2fa_key: string[],
    createdDate? :Date,
    updatedDate? :Date,
    lastestLoginDate? :Date
): Promise<IUser[]> {
    let arr_packet: IUser[] = [];
    const date = new Date();

    for (const share of share_arr_for_2fa_key) {
        const db_packet: IUser = {
            CUUID: uuid,
            Email: email,
            sha3_256: sha3_256_password,
            sha3_384: sha3_384_password,
            createdDate: createdDate||date,
            updatedDate: updatedDate||date,
            lastestLoginDate: lastestLoginDate||date,
            keyOf2FA: share,
            backupCode: backupCodes as  string[] ,
            username: username,
            objHash: "",  // 先佔位
            objSign: "",  // 先佔位
        };
        console.log("source :",JSON.stringify(db_packet));
        

        const cleanPacket: IUser_Hash = { ...db_packet, objHash: "", objSign:"" };
        delete cleanPacket.updatedDate;

        let string_packet = JSON.stringify(cleanPacket);
        console.log("String Packet : ",string_packet);
        
        let org = sha3_256(string_packet);
        if (org != sha3_256_userHash(db_packet)) {
            console.log("function hash not equels to string packet hash");
            throw createError("function hash not equels to string packet hash")
        }
        //throw createError("test : stop ")
        db_packet.objHash = org;

        try {
            db_packet.objSign = await SignMessage.sign(
                process.env.EDDSA_SIGN_PRIVATE_KEY!,
                string_packet           //include sha3_256
            ).then(result => result.mess);
        } catch (error) {
            throw new Error("Error signing message: " + error);
        }

        let isValid_sign = SignMessage.verify(
            process.env.EDDSA_SIGN_PUBLIC_KEY!,
            db_packet.objSign,
            String(db_packet.objHash)
        );

        if (!isValid_sign) {
            throw new Error("Signature verification failed");
        }

        arr_packet.push(db_packet);
    }

    return arr_packet;
}
