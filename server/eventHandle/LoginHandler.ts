import "h3"
import { H3Event, use } from "h3"
import { ILoginRequestSchemaVaildatorRequestObj_without_otp } from "../request_sheme/login/ILoginRequest"
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"
import InvalidError from "../err/InvalidErr"
import { calSharedKey } from "~/shared/useKeyFn"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { IUser, userSchema } from "../db_data_schema/UserSchema"
import { generateJWT } from "../token_validator/jwt"
import { generatePaseto } from "../token_validator/paseto"
import { EncryptedRes } from "~/shared/Request/IEncryptRes"
import SignMessage from "~/shared/Request/signMessage"
import { getCorrectUser } from "../DataFixer/UserInformationFixer"
import EC from "elliptic"

export const loginEvent = async (event: H3Event) => {

    const body = await readBody(event)

    const req = EncryptReqShema.safeParse(body)

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
        await dbConnsOpen(dbNames)


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
            await Promise.all(getAllConns().map(async (conn) => {
                let num = await conn.model("user", userSchema).countDocuments({ username: username });
                if (num == 1) {
                    dbcumCounnt++;
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
                isUsername =true
            }
        } catch (error) {
            console.log(error);
            return {
                sussess: false,
                message : error
            }
        }
        async function loginCompare(inputId:string,sha3_256_pass: string, sha3_384_pass: string,isUsername:boolean) {
            let matchCount = 0;
            let thershold = getThreshold();
            let id: string = "";
            let countError = 0
            let userArr : IUser[] = []
            let problemInt : number[]  =  []
            await Promise.all(getAllConns().map(async (conn,index) => {
                let user
                //console.log(isUsername);
                
                if (isUsername)
                {
                    user = await conn.model("user", userSchema).findOne({ username:inputId,sha3_256: sha3_256_pass, sha3_384 : sha3_384_pass });
                }
                if (!isUsername) {
                    user = await conn.model("user", userSchema).findOne({ Email:inputId,sha3_256: sha3_256_pass, sha3_384 : sha3_384_pass });
                }
                if (user) {
                    //console.log(123);
                    matchCount++;
                    
                    const db_data_verify_packet :IUser = {
                        CUUID : user.CUUID,
                        Email : user.Email,
                        sha3_256 : user.sha3_256,
                        sha3_384 : user.sha3_384,
                        createdDate : user.createdDate,
                        updatedDate : user.updatedDate,
                        lastestLoginDate : user.lastestLoginDate,
                        keyOf2FA : user.keyOf2FA,
                        backupCode: user.backupCode,
                        username : user.username,
                        objHash: "",  // 先佔位
                        objSign: "",  // 先佔位
                    }
                    let verify
                    try {
                        const ecKey = ec_sign_key();
                        if (!ecKey || !("pubkey" in ecKey)) {
                            throw new Error("Invalid EC key: pubkey is missing");
                        }
                        console.log(ecKey.pubkey);
                        
                        verify = SignMessage.verify(ecKey.pubkey, String(user.objSign), String(user.objHash));
                        //todo : issue : verification problem 
                        // let key = new EC.ec("ed25519").keyFromPublic(ecKey.pubkey,"hex")
                        // verify = key.verify(String(user.objHash),String(user.objSign))
                        console.log(verify);
                        

                    } catch (e) {
                        console.log("sign Err", e);
                    }
                    userArr.push(user)
                    console.log(verify);
                    
                    if (verify==false) {
                        problemInt.push(userArr.length-1)
                        countError ++
                    }else{
                        //console.log(1234);
                        
                        id = user.CUUID
                    }
                }
            }));
            if (matchCount === 0) {
                console.log("not found");
                
                throw createError("no matching user found");
            }
            if (matchCount < thershold) {
                console.log("login : main:  <min");
                
                throw createError("not enough matching records (< minimum number)");
            }
            if (countError > thershold) {
                console.log("db - can't fix");
                
                throw createError("Error by db")
            }

            if (countError < thershold && countError !=0) {
                const user = await getCorrectUser(userArr,problemInt)
                console.log(user);
                //no fix now                
            }
            console.log(id);
            
            return id
        }

        let uid 
        try {
            let id: string = isUsername ? d_rq.data.username! : d_rq.data.email!;
            if (!id) {
                throw new Error("Username or email is undefined");
            }
                        
            uid = await loginCompare(id,d_rq.data.hash3_256_password,d_rq.data.hash384_password,isUsername)

            console.log(uid);
            

        } catch (error) {
            console.log(error);
            
            return {
                success : false ,
                message : "username or password error"
            }
            
        }
     
        //sign two token 


        try {
            let response :any = {}
            response["jwt"] = await generateJWT({CUUID:uid,login:"initial"})
            response["paseto"] = await generatePaseto({CUUID:uid,login:"initial"})
            let EncryptedRes = await RequestEncryption.encryptMessage(JSON.stringify(response),shared)
            let encryptResponse :EncryptedRes = {
                iv : EncryptedRes.iv,
                encryptedMessage : EncryptedRes.encryptedMessage,
                success : true
            }
            return encryptResponse
        } catch (error) {
            console.log(error);
            
            return {
                success : false,
                message : "token signature problem"
            }
        }



    } catch (error) {
        return {
            success: false,
            message : error
        }
    } finally {
        await dbConnsClose()
    }

}