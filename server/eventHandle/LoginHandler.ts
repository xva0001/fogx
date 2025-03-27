import "h3"
import { H3Event, use } from "h3"
import { ILoginRequestSchemaVaildatorRequestObj_without_otp } from "../request_sheme/login/ILoginRequest"
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"
import InvalidError from "../err/InvalidErr"
import { calSharedKey } from "~/shared/useKeyFn"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { IUser, IUser_Hash, userSchema } from "../db_data_schema/UserSchema"
import { generateJWT } from "../token_validator/jwt"
import { generatePaseto } from "../token_validator/paseto"
import { EncryptedRes } from "~/shared/Request/IEncryptRes"
import SignMessage from "~/shared/Request/signMessage"
import { getCorrectUser } from "../DataFixer/UserInformationFixer"
import { Mutex } from "async-mutex"; // 確保併發安全
import pkg from "js-sha3"
import { MongoDBConnector } from "../utils/mongodbConn"
import { createSignedPackets } from "../utils/SignIUser"
import { secrets } from "easy-shamir-secret-sharing"
import { sha3_256_userHash } from "../utils/HashedUser"
const { sha3_256, sha3_384 } = pkg


export const loginEvent = async (event: H3Event) => {

    const body = await readBody(event)

    const req = EncryptReqShema.safeParse(body)

    const dbConnector: MongoDBConnector = new MongoDBConnector()

    if (!req.success) {
        return InvalidError()
    }

    let shared
    try {

        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)
        //console.log(shared);
        let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv)

        let d_rq = ILoginRequestSchemaVaildatorRequestObj_without_otp.safeParse(JSON.parse(decrypt))

        if (!d_rq.success) {
            return InvalidError()
        }

        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        //await dbConnsOpen(dbNames)
        await dbConnector.dbConnsOpen(dbNames)

        //override export
        function getAllConns() {
            return dbConnector.getDbConnections()
        }
        async function selectByEmail(email: string) {
            let thershold = getThreshold()
            let dbcumCounnt = 0
            await Promise.all(getAllConns().map(async (conn) => {
                let num = await conn.model("user", userSchema).countDocuments({ Email: email })
                if (num == 1) {
                    dbcumCounnt++
                }
            }))

            if (dbcumCounnt === 0) {
                throw createError("db no record by selectByEmail")
            }
            if (dbcumCounnt < thershold) {
                throw createError("some db no record (< minimum number)")
            }
        }
        async function selectByUsername(username: string) {
            let thershold = getThreshold();
            let dbcumCounnt = 0;
            const mutex = new Mutex(); // 創建互斥鎖

            await Promise.all(getAllConns().map(async (conn) => {
                let num = await conn.model("user", userSchema).countDocuments({ username: username });
                if (num == 1) {
                    const release = await mutex.acquire(); // 鎖定
                    try {
                        dbcumCounnt++; // 安全遞增
                    } finally {
                        release(); // 釋放鎖
                    }
                }
            }));

            if (dbcumCounnt === 0) {
                throw createError("db no record by selectByUsername");
            }
            if (dbcumCounnt < thershold) {
                throw createError("some db no record (< minimum number)");
            }
        }


        let isUsername = false
        try {


            if (d_rq.data.email) {
                await selectByEmail(d_rq.data.email)
            }
            if (d_rq.data.username) {
                await selectByUsername(d_rq.data.username)
                isUsername = true
            }
        } catch (error) {
            console.log(error);
            return {
                sussess: false,
                message: error
            }
        }


        async function loginCompare(inputId: string, sha3_256_pass: string, sha3_384_pass: string, isUsername: boolean) {
            let matchCount = 0;
            let threshold = getThreshold();
            let id: string = "";
            let countError = 0;
            let userArr: (IUser | undefined)[] = [];
            let problemInt: number[] = [];
            
            const mutex = new Mutex(); // Avoid race conditions

            await Promise.all(getAllConns().map(async (conn) => {
                let user;

                if (isUsername) {
                    user = await conn.model("user", userSchema).findOne({ username: inputId, sha3_256: sha3_256_pass, sha3_384: sha3_384_pass }).lean();
                } else {
                    user = await conn.model("user", userSchema).findOne({ Email: inputId, sha3_256: sha3_256_pass, sha3_384: sha3_384_pass }).lean();
                }

                let uuidCount = 0;
                if (user?.CUUID) {
                    uuidCount = await conn.model("user", userSchema).countDocuments({ CUUID: user.CUUID });
                }

                // If uuidCount is 1 and user is undefined -> trigger verify = false
                if ((uuidCount === 1 && !user) || !user ) {
                    const release = await mutex.acquire();
                    try {
                        userArr.push(undefined);
                        problemInt.push(userArr.length - 1);
                        countError++;
                    } finally {
                        release();
                    }
                    return;
                }

                if (user) {
                    const release = await mutex.acquire();

                    const db_data_verify_packet: IUser_Hash = {
                        CUUID: user.CUUID,
                        Email: user.Email,
                        sha3_256: user.sha3_256,
                        sha3_384: user.sha3_384,
                        createdDate: user.createdDate,
                        lastestLoginDate: user.lastestLoginDate,
                        keyOf2FA: user.keyOf2FA, //share
                        backupCode: user.backupCode,
                        username: user.username,
                        objHash: "",
                        objSign: "",
                    };
                    let verify;
                    console.log("constructor String", JSON.stringify(db_data_verify_packet));
                    
                    try {
                        const ecKey = ec_sign_key();
                        if (!ecKey || !("pubkey" in ecKey)) {
                            throw new Error("Invalid EC key: pubkey is missing");
                        }
                        let orgVerify = sha3_256_userHash(user) == user.objHash;
                        console.log("constructor hash : ", sha3_256(JSON.stringify(db_data_verify_packet)));
                        console.log("function hash : ", sha3_256_userHash(user));

                        console.log("Hash : ", orgVerify);
                        console.log("user hash :", user.objHash);

                        if (!orgVerify) {
                            throw new Error("err : hash inconsistant");//
                        } else {
                            verify = SignMessage.verify(ecKey.pubkey, String(user.objSign), String(user.objHash));
                        }

                        if (!verify) {
                            throw new Error("err ; hash val are same, but signature problem");
                        }
                    } catch (e) {
                        console.log("sign Err", e);
                        verify = false;
                    }
                    try {
                        if (verify === false) {
                            userArr.push(undefined);
                            problemInt.push(userArr.length - 1);
                            countError++;
                        } else {
                            userArr.push(user);
                            matchCount++;
                            id = user.CUUID;
                        }
                    } finally {
                        release();
                    }
                }
            }));
            return { matchCount, id, countError, userArr, problemInt };
        }
        let uid
        try {
            let id: string = isUsername ? d_rq.data.username! : d_rq.data.email!;
            if (!id) {
                throw new Error("Username or email is undefined");
            }
            let res = await loginCompare(id, d_rq.data.hash3_256_password, d_rq.data.hash384_password, isUsername)
            //todo : fix error by db, let output the correct IUser
            //CALL DATAfIXER
            async function updateDB(uuid: string, dataUpdate: IUser[],/* problemInt: number[] no use, all update */) {
                await Promise.all(getAllConns().map(async (conn, index) => {
                    const userModel = conn.model("user", userSchema)
                    const updateUser = dataUpdate[index]

                    console.log("updated User :",updateUser);
                    await userModel.updateOne(
                        { CUUID: uuid }, {
                        $set: {
                            Email: updateUser.Email,
                            sha3_256: updateUser.sha3_256,
                            sha3_384: updateUser.sha3_384,
                            createdDate: updateUser.createdDate, //force
                            updatedDate: new Date(),
                            lastestLoginDate: updateUser.lastestLoginDate,
                            keyOf2FA: updateUser.keyOf2FA,
                            backupCode: updateUser.backupCode as string[],
                            icon: updateUser.icon,
                            username: updateUser.username,
                            roles: updateUser.roles,
                            objHash: updateUser.objHash,
                            objSign: updateUser.objSign
                        },
                    }, {
                        strict: false
                    }
                )


                }))
            }
            console.log("countError ",res.countError);
            
            if (res.countError >= getThreshold()) {
                return {
                    success: false,
                    message: "account data modified. login failed  or account and password not match"
                }
            } else if (res.countError < getThreshold() && res.countError != 0 && res.matchCount >= getThreshold() ) {
                console.log("try to fix");
                let r_user = await getCorrectUser(res.userArr, res.problemInt)

                let share_arr_for_2fa_key = await secrets.share(r_user.keyOf2FA, getSharePartNum(), getThreshold())
                console.log(typeof r_user.backupCode);
                r_user.backupCode = typeof r_user.backupCode === "string" 
                ? (r_user.backupCode as string).split(",") 
                : r_user.backupCode;
                let packets = await createSignedPackets(r_user.CUUID, r_user.Email, r_user.sha3_256, r_user.sha3_384, r_user.backupCode, r_user.username, share_arr_for_2fa_key, r_user.createdDate, undefined, r_user.lastestLoginDate)
                //console.log(packets)

                //UPDATE ORGIN DATA//hard code now, wait to reconstruct //todo
                await updateDB(res.id, packets)
                //overwrite 
                res = await loginCompare(id, d_rq.data.hash3_256_password, d_rq.data.hash384_password, isUsername)


            }

            ///no user
            if (!(res.matchCount >= getThreshold())) {
                return {
                    success: false,
                    message: "username or password error"
                }
            }


            uid = res.id

            console.log(uid);


        } catch (error) {
            console.log(error);

            return {
                success: false,
                message: "username or password error"
            }
        }
        try {
            let response: any = {}
            response["jwt"] = await generateJWT({ CUUID: uid, login: "initial" })
            response["paseto"] = await generatePaseto({ CUUID: uid, login: "initial" })
            response["CUUID"] = uid
            let EncryptedRes = await RequestEncryption.encryptMessage(JSON.stringify(response), shared)
            let encryptResponse: EncryptedRes = {
                iv: EncryptedRes.iv,
                encryptedMessage: EncryptedRes.encryptedMessage,
                success: true
            }
            return encryptResponse
        } catch (error) {
            console.log(error);

            return {
                success: false,
                message: "token signature problem"
            }
        }



    } catch (error) {
        return {
            success: false,
            message: error
        }
    } finally {
        await dbConnector.dbConnsClose()
    }

}