import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr"; // error
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn"; // 假設的MongoDB連接器
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema"; // 用戶Schema
import { secrets } from "easy-shamir-secret-sharing";
import { getThreshold } from "~/server/utils/getShareSettings"; // 閾值獲取函數
import { SecFATool, IFactorCheckTool } from "~/shared/2FATool"; // 2FA工具
import { generateJWT, verifyJWT } from "~/server/token_validator/jwt"; // JWT工具
import { generatePaseto, 
         verifyToken, 
         verifyTokenWithBoolean, 
         verifyPasetoForTesting, 
         generatePasetoForTesting} from "~/server/token_validator/paseto"; // Paseto 工具
import { Mutex } from "async-mutex";

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
    await dbConnector.dbConnsOpen(dbNames);
    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();

    if (connections.length < threshold) {
        throw new Error("Not enough database connections available.");
    }

    // 獲取 2FA 密鑰分片
    const keyShares: string[] = [];
    const fetchMutex = new Mutex();

    await Promise.all(connections.map(async (conn) => {
        try {
            const userModel = conn.model<IUser>("user", userSchema);
            const user = await userModel.findOne({ CUUID: decryptedData!.CUUID }).select('keyOf2FA').lean();
            if (user && user.keyOf2FA) {
                const release = await fetchMutex.acquire();
                try {
                    keyShares.push(user.keyOf2FA);
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
        throw new Error("Could not retrieve enough key shares.");
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
        const newJwt = await generateJWT({ CUUID: decryptedData.CUUID, login: "completed" }); // 更新 claim
        const newPaseto = await generatePaseto({ CUUID: decryptedData.CUUID, login: "completed" }); // 更新 claim

        responsePayload = {
            success: true,
            jwt: newJwt,
            paseto: newPaseto,
        };
        console.log("Validation successful. Payload:", responsePayload);

        const updateMutex = new Mutex();
        const updateDate = new Date();

        await Promise.all(connections.map(async (conn,index) => {
            try {
                const userModel = conn.model<IUser>("user", userSchema);
                //wrong update : 
                //await userModel.updateOne({ CUUID: decryptedData!.CUUID }, { $set: { lastestLoginDate: updateDate, updatedDate: updateDate } });

                

            } catch (updateError) {
                console.error(`Failed to update last login date on DB ${conn.name}:`, updateError);
                // 記錄錯誤
            }
        }));

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
        success: true, // API 請求本身成功（即使 2FA 驗證失敗）
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
                success: true, // API 請求本身成功，但業務邏輯失敗
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