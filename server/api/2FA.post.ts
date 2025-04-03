import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr"; // error
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn"; // 假設的MongoDB連接器
import { userSchema, IUser, Role } from "~/server/db_data_schema/UserSchema"; // 用戶Schema
import { secrets } from "easy-shamir-secret-sharing";
import { getThreshold } from "~/server/utils/getShareSettings"; // 閾值獲取函數
import { SecFATool, IFactorCheckTool } from "~/shared/2FATool"; // 2FA工具
import { generateJWT, verifyJWT } from "~/server/token_validator/jwt"; // JWT工具
import {
    generatePaseto,
    verifyToken,
    verifyTokenWithBoolean,
    verifyPasetoForTesting,
    generatePasetoForTesting
} from "~/server/token_validator/paseto"; // Paseto 工具
import { Mutex } from "async-mutex";
import { getCorrectUser } from "../DataFixer/UserInformationFixer";
import { cleanMongoObject } from "../utils/cleanObject";
import SignMessage from "~/shared/Request/signMessage";

// 定義解密後請求體的 Zod Schema
const I2FARequestSchema = z.object({
    CUUID: z.string().uuid("Invalid CUUID format"),
    code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
    jwt: z.string(),
    paseto: z.string(),
});

type T2FARequest = z.infer<typeof I2FARequestSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof InvalidError> | ReturnType<typeof createError>> => {
    const body = await readBody(event);
    const req = EncryptReqShema.safeParse(body);
    const dbConnector: MongoDBConnector = new MongoDBConnector();
    const twoFATool: IFactorCheckTool = SecFATool(); // 獲取 2FA 工具實例

    if (!req.success) {
        console.error("Invalid request body structure:", req.error);
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: "Invalid request structure."
        });
    }

    let shared: string | undefined;
    let decryptedData: T2FARequest | undefined;

    try {
        // 計算共享密鑰
        shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
        if (!shared) {
            throw new Error("Failed to calculate shared key.");
        }

        // 解密請求
        const decrypt = await RequestEncryption.decryptMessage(
            req.data.encryptedMessage,
            shared,
            req.data.iv
        );

        // 驗證解密後的數據結構
        const parsedDecrypt = I2FARequestSchema.safeParse(JSON.parse(decrypt));
        if (!parsedDecrypt.success) {
            console.error("Invalid decrypted data structure:", parsedDecrypt.error);
            throw new Error("Invalid decrypted data format.");
        }
        decryptedData = parsedDecrypt.data;

        /// 驗證初始 Token

        // 這裡需要實現 verifyJWT 和 verifyPaseto 函數
        // 確保 token 有效且 CUUID 匹配
        const jwtPayload = await verifyJWT(decryptedData.jwt);
        const pasetoPayload = await verifyToken(decryptedData.paseto);
        console.log("JWT Payload:", jwtPayload);
        console.log("Paseto Payload:", pasetoPayload);

        // 檢查 JWT
        if (!jwtPayload || jwtPayload.CUUID !== decryptedData.CUUID || jwtPayload.login !== "initial") {
            throw new Error("Invalid or expired initial JWT.");
        }
        // 檢查 Paseto (假設 verifyToken 成功 = payload，error = null/undefined)
        if (!pasetoPayload || pasetoPayload.CUUID !== decryptedData.CUUID || pasetoPayload.login !== "initial") {
            throw new Error("Invalid or expired initial Paseto token.");
        }


        // db 
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        //tokenVaildTime_loged : 1200_000 
        const tokenTime: number = useAppConfig().verification.tokenVaildTime_loged

        await dbConnector.dbConnsOpen(dbNames);
        const connections = dbConnector.getDbConnections();
        const threshold = getThreshold();

        if (connections.length < threshold) {
            throw new Error("Not enough database connections available.");
        }

        // 獲取 2FA 密鑰分片
        const keyShares: string[] = [];
        const fetchMutex = new Mutex();
        const userArr: (IUser | undefined)[] = []
        const problemInt: number[] = []


        await Promise.all(connections.map(async (conn, index) => {
            try {
                const userModel = conn.model<IUser>("user", userSchema);
                const user = await userModel.findOne({ CUUID: decryptedData!.CUUID }).select('keyOf2FA').lean();
                const userInfo = await userModel.findOne({ CUUID: decryptedData!.CUUID }).lean()
                if (user && user.keyOf2FA) {
                    const release = await fetchMutex.acquire();
                    try {
                        keyShares.push(user.keyOf2FA);
                        if (userInfo) {
                            userArr.push(cleanMongoObject(userInfo) as IUser);
                            console.log(userInfo);

                        } else {
                            userArr.push(undefined)
                            problemInt.push(index)
                            throw new Error()

                        }
                    } finally {
                        release();
                    }
                }
            } catch (dbError) {
                console.error(`Error fetching key share from DB ${conn.name}:`, dbError);
            }
        }));

        console.log(`Connections: ${connections.length}, Threshold: ${threshold}`);
        console.log(`Key shares found: ${keyShares.length}`);
        if (keyShares.length < threshold) {
            console.error(`Insufficient key shares found (${keyShares.length}) for CUUID: ${decryptedData.CUUID}. Required: ${threshold}`);
            throw new Error("Could not retrieve enough key shares, please try login again");
        }

        // 重組 2FA 密鑰
        let reconstructedKey: string;
        try {
            reconstructedKey = await secrets.combine(keyShares.slice(0, threshold)); // 閾值數量的分片
            console.log("Key reconstructed successfully.");
        } catch (combineError) {
            console.error("Failed to combine key shares:", combineError);
            throw new Error("Error reconstructing 2FA key.");
        }

        // 驗證 TOTP Code
        const currentCounter = Math.floor(Date.now() / 1000 / 30); // TOTP 時間 = 30 秒
        const isValidCode = twoFATool.validator(
            reconstructedKey,
            decryptedData.code,
            currentCounter,
            { drift: 1 } // 允許誤差 (共 30*3 = 90 秒窗口)
        );
        console.log("Is code valid?", isValidCode);

        let responsePayload: object;

        if (isValidCode) {
            // 驗證成功: 生成新 Token

            const newJwt = await generateJWT({ CUUID: decryptedData.CUUID, login: "completed" }, tokenTime); // 更新 claim
            const newPaseto = await generatePaseto({ CUUID: decryptedData.CUUID, login: "completed" }, tokenTime); // 更新 claim

            responsePayload = {
                success: true,
                jwt: newJwt,
                paseto: newPaseto,
            };
            console.log("Validation successful. Payload:", responsePayload);

            //part : database 
            const updateMutex = new Mutex();
            const updateDate = new Date();
            let corr = await getCorrectUser(userArr, problemInt)
            corr.backupCode = typeof corr.backupCode === "string"
                ? (corr.backupCode as string).split(",")
                : corr.backupCode
            //not use
            // corr.roles = typeof corr.roles === "string"
            // ? (corr.roles as string).split(",") as Role[]
            // : corr.roles as Role[]; 
            //get signedPacket
            console.log(corr);


            let totalConnections = dbConnector.getDbConnections().length

            let threshold = getThreshold()
            // Update key share with improved rollback mechanism
            let ks = await secrets.share(reconstructedKey, getSharePartNum(), threshold);
            let packets = await createSignedPackets(
                corr.CUUID,
                corr.Email,
                corr.sha3_256,
                corr.sha3_384,
                corr.backupCode,
                corr.username,
                ks,
                corr.createdDate
            );

            console.log("Generated packets:", packets);

            // Phase 1: Backup original data from all connections
            const backups: { connName: string; originalData: any }[] = [];
            try {
                // First backup all original data
                await Promise.all(connections.map(async (conn) => {
                    try {
                        const userModel = conn.model<IUser>("user", userSchema);
                        const originalData = await userModel.findOne({ CUUID: corr.CUUID }).lean();
                        if (!originalData) {
                            throw new Error(`Original data not found for CUUID: ${corr.CUUID}`);
                        }
                        backups.push({ connName: conn.name, originalData });
                    } catch (error) {
                        console.error(`Failed to backup data from ${conn.name}:`, error);
                        throw error; // Abort if backup fails
                    }
                }));
                const successfulBackups = backups.length;
                if (successfulBackups < threshold) {
                    console.error(`Backup phase failed: Only ${successfulBackups}/${threshold} successful backups`);
                    throw new Error(`Insufficient backups (${successfulBackups}) for threshold (${threshold})`);
                }
                console.log(`Backup phase completed: ${successfulBackups}/${totalConnections} successful`);




                // Phase 2: Perform updates with verification
                const errors: { connName: string; error: Error }[] = [];

                await Promise.all(connections.map(async (conn, index) => {
                    try {
                        const userModel = conn.model<IUser>("user", userSchema);
                        const packet = packets[index];

                        // Update or insert the document
                        const updateResult = await userModel.updateOne(
                            { CUUID: corr.CUUID },
                            { $set: packet },
                            { upsert: true, strict: false }
                        );

                        // Verification
                        const updatedDoc = await userModel.findOne({ CUUID: corr.CUUID }).lean();
                        if (!updatedDoc) {
                            throw new Error("Document not found after update");
                        }

                        const cleanObj = cleanMongoObject(updatedDoc) as IUser;
                        if (cleanObj == null) {
                            throw new Error("db data lost ")
                        }
                        const cal_hash = sha3_256_userHash(cleanObj);

                        const expected_hash = sha3_256_userHash(packet);

                        if (cal_hash !== expected_hash) {
                            console.error(`Hash mismatch for ${conn.name}:`, {
                                calculated: cal_hash,
                                expected: expected_hash,
                                cleanObj,
                                packet
                            });
                            throw new Error(`Hash verification failed for ${conn.name}`);
                        }

                        console.log(`Successfully updated ${conn.name}`);

                    } catch (error) {
                        console.error(`Failed to update on DB ${conn.name}:`, error);
                        errors.push({ connName: conn.name, error: error as Error });
                    }
                }));


                // 檢查更新階段是否滿足閾值
                const successfulUpdates = totalConnections - errors.length;
                if (successfulUpdates < threshold) {
                    console.error(`❌ Update phase failed: Only ${successfulUpdates}/${threshold} successful updates`);
                    console.log("⚠️ Proceeding to Phase 3: Rollback");
                } else {
                    console.log(`✅ Update phase completed: ${successfulUpdates}/${totalConnections} successful`);
                    console.log("🏁 All operations completed successfully");
                    //return; // 成功完成，直接返回
                }




                // Phase 3: Rollback if any errors occurred
                if (errors.length > 0) {
                    console.error("⚠️ Errors occurred during update, initiating rollback...");
                    const rollbackTargets = backups.filter(backup => 
                        !errors.some(e => e.connName === backup.connName)
                    );
                    const rollbackResults = await Promise.all(rollbackTargets.map(async (backup) => {
                        try {
                            const conn = connections.find(c => c.name === backup.connName);
                            if (!conn) {
                                console.error(`Connection not found: ${backup.connName}`);
                                return { connName: backup.connName, success: false };
                            }
                    
                            const userModel = conn.model<IUser>("user", userSchema);
                            await userModel.updateOne(
                                { CUUID: corr.CUUID },
                                { $set: backup.originalData },
                                { strict: false }
                            );
                            return { connName: backup.connName, success: true };
                        } catch (rollbackError) {
                            console.error(`Rollback failed for ${backup.connName}:`, rollbackError);
                            return { connName: backup.connName, success: false };
                        }
                    }));
                    const failedRollbacks = rollbackResults.filter(r => !r.success);
                    if (failedRollbacks.length > 0) {
                        console.error("Critical: Failed to rollback these connections:", failedRollbacks);
                        throw new Error(`Update failed and rollback incomplete for ${failedRollbacks.length} connections`);
                    }

                    throw new Error(`Update failed, rollback completed for ${rollbackResults.length} connections`);
                }

                console.log("✅ All update operations completed successfully");
            } catch (error) {
                console.error("Critical error in key share update process:", error);
                throw error; // Re-throw for upper level handling

            }

            //end part database


        } else {
            // 驗證失敗
            console.warn(`Invalid 2FA code attempt for CUUID: ${decryptedData.CUUID}`);
            responsePayload = {
                success: false,
                message: "Invalid 2FA code.",
            };
            console.log("Validation failed. Payload:", responsePayload);
        }

        // 加密回應
        const encryptedResponseData = await RequestEncryption.encryptMessage(
            JSON.stringify(responsePayload),
            shared
        );

        return {
            success: true,
            iv: encryptedResponseData.iv,
            encryptedMessage: encryptedResponseData.encryptedMessage,
        };

    } catch (error: any) {

        console.error("!!! Error caught in /api/2FA backend:", error);

        // 嘗試加密錯誤訊息回傳
        if (shared) {
            try {
                const errorPayload = {
                    success: false,
                    message: error.message || "An unexpected error occurred during 2FA verification.",
                };
                const encryptedError = await RequestEncryption.encryptMessage(
                    JSON.stringify(errorPayload),
                    shared
                );
                return {
                    success: false,
                    iv: encryptedError.iv,
                    encryptedMessage: encryptedError.encryptedMessage,
                };
            } catch (encryptionError) {
                console.error("Failed to encrypt error response:", encryptionError);
                // 如果連加密錯誤訊息都失敗，返回通用 H3 錯誤
                return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
            }
        } else {
            // 如果連 shared key 都沒有，無法加密錯誤訊息
            return createError({ statusCode: 500, statusMessage: "Server Error", data: error.message || "Failed to process request." });
        }

    } finally {

        await dbConnector.dbConnsClose();
    }
});
