// Import required modules and types
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
import { Mutex } from "async-mutex"; // For thread-safe operations
import pkg from "js-sha3"
import { MongoDBConnector } from "../utils/mongodbConn"
import { createSignedPackets } from "../utils/SignIUser"
import { secrets } from "easy-shamir-secret-sharing"
import { sha3_256_userHash } from "../utils/HashedUser"
const { sha3_256, sha3_384 } = pkg

/**
 * Main login event handler
 * @param event - H3 event object containing the request
 * @returns Encrypted response with tokens or error message
 */
export const loginEvent = async (event: H3Event) => {
    // Read and parse request body
    const body = await readBody(event)
    const req = EncryptReqShema.safeParse(body)
    const dbConnector: MongoDBConnector = new MongoDBConnector()

    // Validate request format
    if (!req.success) {
        return InvalidError()
    }

    let shared
    try {
        // Calculate shared key for ECDH encryption
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)
        
        // Decrypt the encrypted message from client
        let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv)
        
        // Parse decrypted login request
        let d_rq = ILoginRequestSchemaVaildatorRequestObj_without_otp.safeParse(JSON.parse(decrypt))

        if (!d_rq.success) {
            return InvalidError()
        }

        // Connect to all configured MongoDB databases
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        await dbConnector.dbConnsOpen(dbNames)

        // Helper function to get all database connections
        function getAllConns() {
            return dbConnector.getDbConnections()
        }

        /**
         * Check if email exists in enough databases (meets threshold)
         * @param email - User's email to check
         * @throws Error if email not found in enough databases
         */
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

        /**
         * Check if username exists in enough databases (meets threshold)
         * @param username - Username to check
         * @throws Error if username not found in enough databases
         */
        async function selectByUsername(username: string) {
            let thershold = getThreshold();
            let dbcumCounnt = 0;
            const mutex = new Mutex(); // Mutex for thread-safe counter increment

            await Promise.all(getAllConns().map(async (conn) => {
                let num = await conn.model("user", userSchema).countDocuments({ username: username });
                if (num == 1) {
                    const release = await mutex.acquire();
                    try {
                        dbcumCounnt++;
                    } finally {
                        release();
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

        // Check if login is by username or email
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

        /**
         * Compare login credentials across all databases
         * @param inputId - Username or email
         * @param sha3_256_pass - SHA3-256 hashed password
         * @param sha3_384_pass - SHA3-384 hashed password 
         * @param isUsername - Flag indicating if login is by username
         * @returns Object with match count, user ID, error count, user array and problem indices
         */
        async function loginCompare(inputId: string, sha3_256_pass: string, sha3_384_pass: string, isUsername: boolean) {
            let matchCount = 0;
            let threshold = getThreshold();
            let id: string = "";
            let countError = 0;
            let userArr: (IUser | undefined)[] = [];
            let problemInt: number[] = [];
            
            const mutex = new Mutex(); // For thread-safe operations

            await Promise.all(getAllConns().map(async (conn) => {
                let user;

                // Find user by username or email
                if (isUsername) {
                    user = await conn.model("user", userSchema).findOne({ 
                        username: inputId, 
                        sha3_256: sha3_256_pass, 
                        sha3_384: sha3_384_pass 
                    }).lean();
                } else {
                    user = await conn.model("user", userSchema).findOne({ 
                        Email: inputId, 
                        sha3_256: sha3_256_pass, 
                        sha3_384: sha3_384_pass 
                    }).lean();
                }

                // Check if user exists by CUUID
                let uuidCount = 0;
                if (user?.CUUID) {
                    uuidCount = await conn.model("user", userSchema).countDocuments({ CUUID: user.CUUID });
                }

                // Handle cases where user data is inconsistent
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

                    // Create verification packet
                    const db_data_verify_packet: IUser_Hash = {
                        CUUID: user.CUUID,
                        Email: user.Email,
                        sha3_256: user.sha3_256,
                        sha3_384: user.sha3_384,
                        createdDate: user.createdDate,
                        lastestLoginDate: user.lastestLoginDate,
                        keyOf2FA: user.keyOf2FA,
                        backupCode: user.backupCode,
                        username: user.username,
                        objHash: "",
                        objSign: "",
                    };
                    
                    let verify;
                    console.log("constructor String", JSON.stringify(db_data_verify_packet));
                    
                    try {
                        // Verify user data integrity
                        const ecKey = ec_sign_key();
                        if (!ecKey || !("pubkey" in ecKey)) {
                            throw new Error("Invalid EC key: pubkey is missing");
                        }
                        
                        // Verify hash consistency
                        let orgVerify = sha3_256_userHash(user) == user.objHash;
                        console.log("constructor hash : ", sha3_256(JSON.stringify(db_data_verify_packet)));
                        console.log("function hash : ", sha3_256_userHash(user));

                        console.log("Hash : ", orgVerify);
                        console.log("user hash :", user.objHash);

                        if (!orgVerify) {
                            throw new Error("err : hash inconsistant");
                        } else {
                            // Verify signature
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
                            // Mark as invalid user
                            userArr.push(undefined);
                            problemInt.push(userArr.length - 1);
                            countError++;
                        } else {
                            // Valid user found
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
            
            // Compare login credentials across databases
            let res = await loginCompare(id, d_rq.data.hash3_256_password, d_rq.data.hash384_password, isUsername)
            
            /**
             * Update user data in all databases
             * @param uuid - User's CUUID
             * @param dataUpdate - Array of user data to update
             */
            async function updateDB(uuid: string, dataUpdate: IUser[]) {
                await Promise.all(getAllConns().map(async (conn, index) => {
                    const userModel = conn.model("user", userSchema)
                    const updateUser = dataUpdate[index]

                    console.log("updated User :",updateUser);
                    let resdb = await userModel.updateOne(
                        { CUUID: uuid }, {
                        $set: {
                            Email: updateUser.Email,
                            sha3_256: updateUser.sha3_256,
                            sha3_384: updateUser.sha3_384,
                            createdDate: updateUser.createdDate,
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
                    })
                
                    if (resdb.modifiedCount == 0) {
                        await new userModel(updateUser).save()
                    }
                }))
            }
            
            console.log("countError ",res.countError);
            
            // Handle different error scenarios
            if (res.countError >= getThreshold()) {
                return {
                    success: false,
                    message: "account data modified. login failed or account and password not match"
                }
            } else if (res.countError < getThreshold() && res.countError != 0 && res.matchCount >= getThreshold() ) {
                console.log("try to fix");
                // Get corrected user data
                let r_user = await getCorrectUser(res.userArr, res.problemInt)

                // Split 2FA key using Shamir's secret sharing
                let share_arr_for_2fa_key = await secrets.share(r_user.keyOf2FA, getSharePartNum(), getThreshold())
                
                // Normalize backup codes
                r_user.backupCode = typeof r_user.backupCode === "string" 
                    ? (r_user.backupCode as string).split(",") 
                    : r_user.backupCode;
                
                // Create signed user data packets
                let packets = await createSignedPackets(
                    r_user.CUUID, 
                    r_user.Email, 
                    r_user.sha3_256, 
                    r_user.sha3_384, 
                    r_user.backupCode, 
                    r_user.username, 
                    share_arr_for_2fa_key, 
                    r_user.createdDate, 
                    undefined, 
                    r_user.lastestLoginDate
                )

                // Update databases with corrected data
                await updateDB(res.id, packets)
                
                // Re-verify after update
                res = await loginCompare(id, d_rq.data.hash3_256_password, d_rq.data.hash384_password, isUsername)
            }

            // Final verification
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
            // Generate tokens for successful login
            let response: any = {}
            response["jwt"] = await generateJWT({ CUUID: uid, login: "initial" })
            response["paseto"] = await generatePaseto({ CUUID: uid, login: "initial" })
            response["CUUID"] = uid
            
            // Encrypt response before sending
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
        // Close all database connections
        await dbConnector.dbConnsClose()
    }
}
