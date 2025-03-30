// Import required modules and types
import "h3"
import { H3Event } from "h3"
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq"
import InvalidError from "../err/InvalidErr"
import { calSharedKey } from "~/shared/useKeyFn"
import RequestEncryption from "~/shared/Request/requestEncrytion"
import { IUser, IUser_Hash, userSchema } from "../db_data_schema/UserSchema"
import { Mutex } from "async-mutex"
import pkg from "js-sha3"
import { MongoDBConnector } from "../utils/mongodbConn"
import { createSignedPackets } from "../utils/SignIUser"
import { secrets } from "easy-shamir-secret-sharing"
import { sha3_256_userHash } from "../utils/HashedUser"
import SignMessage from "~/shared/Request/signMessage"
import { generateJWT, verifyJWT } from "../token_validator/jwt"
import { generatePaseto, verifyToken } from "../token_validator/paseto"
import { z } from "zod"
import IPasswordUpdateRequestSchema from "../request_sheme/handleUserInfoUpdate/IPasswordUpdateRequestSchema"
import { getCorrectUser } from "../DataFixer/UserInformationFixer"
const { sha3_256, sha3_384 } = pkg



type IPasswordUpdateRequest = z.infer<typeof IPasswordUpdateRequestSchema>;

/**
 * Main password update event handler
 * @param event - H3 event object containing the request
 * @returns Encrypted response with success status
 */
export const updatePasswordEvent = async (event: H3Event) => {
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

        // Parse and validate decrypted password update request
        const parsed = IPasswordUpdateRequestSchema.safeParse(JSON.parse(decrypt))
        if (!parsed.success) {
            console.error("Invalid password update request:", parsed.error)
            return InvalidError()
        }
        const d_rq = parsed.data

        //---------------------------------------------------------------------------------------------
        // Verify tokens
        const jwtPayload = await verifyJWT(d_rq.jwt)
        const pasetoPayload = await verifyToken(d_rq.paseto)

        if (!jwtPayload || jwtPayload.CUUID !== d_rq.CUUID || jwtPayload.login !== "completed") {
            return {
                success: false,
                message: "Invalid or expired JWT token"
            }
        }
        if (!pasetoPayload || pasetoPayload.CUUID !== d_rq.CUUID || pasetoPayload.login !== "completed") {
            return {
                success: false,
                message: "Invalid or expired Paseto token"
            }
        }
        //----------------------------------------------------------------------------------------------

        // Connect to all configured MongoDB databases
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        await dbConnector.dbConnsOpen(dbNames)

        // Helper function to get all database connections
        function getAllConns() {
            return dbConnector.getDbConnections()
        }

        ///-------------------------------------------------------------------------------------------------------------------

        /**
         * Verify old password across databases
         * @param CUUID - User's CUUID
         * @param oldHash256 - Old SHA3-256 hash
         * @param oldHash384 - Old SHA3-384 hash
         * @returns Object with match count and user array
         */
        async function verifyOldPassword(CUUID: string, oldHash256: string, oldHash384: string) {
            let matchCount = 0;
            let threshold = getThreshold();
            let userArr: (IUser | undefined)[] = [];
            let problemInt :number[] =[]
            const mutex = new Mutex();

            await Promise.all(getAllConns().map(async (conn,index) => {
                let user = await conn.model("user", userSchema).findOne({
                    CUUID,
                    sha3_256: oldHash256,
                    sha3_384: oldHash384
                }).lean();

                if (user) {
                    const release = await mutex.acquire();
                    try {
                        userArr.push(user);
                        matchCount++;
                    } finally {
                        release();
                    }
                } else {
                    const release = await mutex.acquire();
                    try {
                        userArr.push(undefined);
                        problemInt.push(index)
                    } finally {
                        release();
                    }
                }
            }));

            return { matchCount, userArr,problemInt };
        }
        //----------------------------------------------------------------------------------------------------------------
        // Verify old password
        let verification = await verifyOldPassword(
            d_rq.CUUID,
            d_rq.old_hash3_256_password,
            d_rq.old_hash384_password
        )

        if (verification.matchCount < getThreshold()) {
            return {
                success: false,
                message: "Old password verification failed"
            }
        }

        /**
         * Update password in all databases
         * @param CUUID - User's CUUID
         * @param newHash256 - New SHA3-256 hash
         * @param newHash384 - New SHA3-384 hash
         * @param userArr - Array of user data from verification
         */
        async function updatePassword(CUUID: string, newHash256: string, newHash384: string, userArr: (IUser | undefined)[], problemInt: number[]) {

            let correctUser: IUser = await getCorrectUser(userArr,problemInt)
            correctUser.backupCode = typeof correctUser.backupCode === "string" 
            ? (correctUser.backupCode as string).split(",") 
            : correctUser.backupCode;
            // Generate 2FA key shares once before the loop
            const share_arr_for_2fa_key = await secrets.share(
                correctUser.keyOf2FA,
                getSharePartNum(),
                getThreshold()
            )
            const packets = await createSignedPackets(
                correctUser.CUUID,
                correctUser.Email,
                newHash256,
                newHash384,
                correctUser.backupCode,
                correctUser.username,
                share_arr_for_2fa_key,
                correctUser.createdDate,
                new Date(),
                correctUser.lastestLoginDate
            )
            console.log(packets);
            
            await Promise.all(getAllConns().map(async(conn,index)=>{
                const userModel = conn.model("user",userSchema)

                const packet = packets[index]
                if (!packet) {
                    return
                }
                //todo : wait to activate !
                return
                let resdb = await userModel.updateOne({CUUID : correctUser.CUUID},{
                    $set :{
                        Email : packet.Email,
                        sha3_256 : packet.sha3_256,
                        sha3_384:packet.sha3_384 ,
                        createdDate : packet.createdDate,
                        updatedDate : packet.updatedDate,
                        lastestLoginDate : packet.lastestLoginDate ,
                        keyOf2FA:packet.keyOf2FA,
                        backupCode : packet.backupCode as string[],
                        username:packet.username,
                        objHash:packet.objHash,
                        objSign:packet.objSign

                    },
                    
                },{strict:false})//
                if (resdb.modifiedCount===0) {
                    await new userModel(packet).save()
                }
                
            }))
        }

        // Update password in all databases
        await updatePassword(
            d_rq.CUUID,
            d_rq.new_hash3_256_password,
            d_rq.new_hash384_password,
            verification.userArr,
            verification.problemInt
        )

        return {
            success : false ,
            message : "testing"
        }
        // Generate new tokens after password update
        const newJwt = await generateJWT({ CUUID: d_rq.CUUID, login: "completed" })
        const newPaseto = await generatePaseto({ CUUID: d_rq.CUUID, login: "completed" })

        const responsePayload = {
            success: true,
            message: "Password updated successfully",
            jwt: newJwt,
            paseto: newPaseto
        }

        // Encrypt response
        const encryptedResponse = await RequestEncryption.encryptMessage(
            JSON.stringify(responsePayload),
            shared
        )

        return {
            success: true,
            iv: encryptedResponse.iv,
            encryptedMessage: encryptedResponse.encryptedMessage
        }

    } catch (error: any) {
        console.error("Password update error:", error)
        const errorPayload = {
            success: false,
            message: error.message || "Password update failed"
        }

        if (shared) {
            const encryptedError = await RequestEncryption.encryptMessage(
                JSON.stringify(errorPayload),
                shared
            )
            return {
                success: false,
                iv: encryptedError.iv,
                encryptedMessage: encryptedError.encryptedMessage
            }
        }
        return errorPayload
    } finally {
        // Close all database connections
        await dbConnector.dbConnsClose()
    }
}
