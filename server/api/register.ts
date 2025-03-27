import EC from "elliptic"
import InvalidError from "../err/InvalidErr"
import { ICreateAccountSchemaVaildatorRequestObj } from "../request_sheme/register/ICreateAccount"
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"
import { calSharedKey } from "~/shared/useKeyFn"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { v4 as uuidv4Generate } from "uuid"
import { secrets } from 'easy-shamir-secret-sharing';
import { getSharePartNum, getThreshold } from "../utils/getShareSettings"
import { IUser, IUser_Hash, User, userSchema } from "../db_data_schema/UserSchema"
import pkg from "js-sha3"
const { sha3_256, sha3_384 } = pkg
import SignMessage from "~/shared/Request/signMessage"
import mongoose from "mongoose"
import { MongoDBConnector } from "../utils/mongodbConn"

export default defineEventHandler(async (event) => {




    const body = await readBody(event)

    console.log(body);


    const req = EncryptReqShema.safeParse(body)

    const dbConnector : MongoDBConnector = new MongoDBConnector()

    if (!req.success) {

        return InvalidError()
    }

    try {

        let shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)
        console.log(shared);

        let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv)

        //        console.log(decrypt);


        //let test_d_rq = ICreateAccountSchemaVaildatorRequestObj.parse(JSON.parse(decrypt))
        let d_rq = ICreateAccountSchemaVaildatorRequestObj.safeParse(JSON.parse(decrypt))

        if (!d_rq.success) {
            return InvalidError()
        }

        if (d_rq.data.username.length < 4 || d_rq.data.username.length > 40 ) {
            return createError("username is not allowed. length must >= 4 and  < 40" )
        }

        let uuid = uuidv4Generate()

        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;

        //db control
        //await dbConnsOpen(dbNames)
        await dbConnector.dbConnsOpen(dbNames)

        //override export
        function getAllConns(){
            return dbConnector.getDbConnections()
        }
        //

        let connNum = getAllConns().length

        if (connNum === 0) {
            throw createError("All DB Connect Fail")
        }
        if (connNum != useAppConfig().db.conntion.conn_string_env_arr.length) {
            console.log("db or settings problem, but ok");
            console.log(getAllConns().length);
            console.log(connNum);
            //console.log(useAppConfig().db.conntion.conn_string_env_arr.length);       
        }
        //default 3,2
        const share_arr_for_2fa_key = await secrets.share(d_rq.data.twoFAKey, getSharePartNum(), getThreshold())

        const combine = await secrets.combine(share_arr_for_2fa_key)

        try {
            if(!(sha3_256(d_rq.data.twoFAKey)==sha3_256(combine))){
                throw createError("msg splited failed")
            }
        } catch (error) {
            
            return {
                success : false,
                message : "msg  splite failed"
            }

        }

        //console.log(share_arr_for_2fa_key);


        async function check(): Promise<boolean> {
            await Promise.all(getAllConns().map(async (conn) => {
                let num = await conn.model("user", userSchema).countDocuments({ CUUID: uuid });
                if (num > 0) {
                    //generate uuid again
                    return false
                }
                let email_count = await conn.model("user", userSchema).countDocuments({ Email: d_rq.data?.email })
                if (email_count > 0) {
                    throw createError("Email cannot be registered")
                }
                let username_count = await conn.model("user").countDocuments({ username: d_rq.data?.username })
                if (username_count > 0) {
                    throw createError("username cannot be registered")
                }
            }));
            return true
        }


        try {
            while (await check() === false) {
                uuid = uuidv4Generate()
                console.log("fail generate uuid?");

            }
        } catch (e) {
            console.log(e);
            throw createError("db - error - check")
        }

        console.log("testing");

        let date = new Date()

        async function input(data: IUser[]): Promise<number> {
            await Promise.all(getAllConns().map(async (conn, index) => {
                const user = conn.model("user", userSchema);
                const newUser = new user(data[index]);
                await newUser.save();
                console.log("new user");
            }));
            return data.length;
        }        
        console.log("testing2");
        console.log(share_arr_for_2fa_key.length);
        let InsertedCounter = 0;
        let response = { success: false }

        try {
            let arr_packet = []
            for (const share of share_arr_for_2fa_key) {
                const db_packet: IUser = {
                    CUUID: uuid,
                    Email: d_rq.data.email,
                    sha3_256: d_rq.data.sha3_256_password,
                    sha3_384: d_rq.data.sha3_384_password,
                    createdDate: date,
                    updatedDate: date,
                    lastestLoginDate: date,
                    keyOf2FA: share,
                    backupCode: d_rq.data.backupCodes,
                    username: d_rq.data.username,
                    objHash: "",  // 先佔位
                    objSign: "",  // 先佔位
                };
                const cleanPacket : IUser_Hash = { ...db_packet, objHash: String(db_packet.objHash) as string }; //淺copy
                delete cleanPacket.updatedDate;
                delete cleanPacket.lastestLoginDate;
                ///const hash = sha3_256(JSON.stringify(cleanPacket));
                let string_packet = JSON.stringify(cleanPacket)
                let org = sha3_256(string_packet)
                // 現在才產生 hash/sign，確保型別不會爆炸
                db_packet.objHash = org;
                db_packet.objSign = await SignMessage.sign(
                    process.env.EDDSA_SIGN_PRIVATE_KEY!,
                    string_packet                          //sign include sha3_256
                ).then(result => result.mess);
                let isValid_sign =false
                isValid_sign = SignMessage.verify(process.env.EDDSA_SIGN_PUBLIC_KEY!,db_packet.objSign,String(db_packet.objHash))
                if (isValid_sign==false) {                   
                    return createError("sign err ")
                }
                console.log(isValid_sign);
                arr_packet.push(db_packet)
            }
            try {
                InsertedCounter = await input(arr_packet);
            } catch (e) {
                console.log("user : register : err", e);
            }
            // return {
            //     success : false
            // }
            console.log("threshold : ", getThreshold());

            if (InsertedCounter >= getThreshold()) {
                console.log("new user here");
                response.success = true
            } else {
                console.log("not enough successful inserts, cleaning up partial data...");
                // 嘗試清除已經插入的資料
                await Promise.all(getAllConns().map(async (conn) => {
                    try {
                        const userModel = conn.model("user", userSchema);
                        const deleted = await userModel.deleteMany({ CUUID: uuid });
                        console.log(`Cleanup done on ${conn.name}: deleted ${deleted.deletedCount} entries`);
                    } catch (e) {
                        console.error(`Cleanup failed on ${conn.name}`, e);
                    }
                }));
                response.success = false
            }
        } catch (error) {
            console.log(error);

            console.log("unexpected error during insertion", error);
            response.success = false
        }
        return response

    } catch (error) {

        console.log(error);
        //return {good: "bad"}
        return { success: false }
    }

    finally {
        await dbConnector.dbConnsClose()
    }
})