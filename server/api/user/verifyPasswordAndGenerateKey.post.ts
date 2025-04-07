import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr"; // 確保路徑正確
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn"; // 確保路徑正確
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema"; // 確保路徑正確
import { getThreshold } from "~/server/utils/getShareSettings"; // 確保路徑正確
import { verifyJWT } from "~/server/token_validator/jwt"; // 確保路徑正確
import { verifyToken } from "~/server/token_validator/paseto"; // 確保路徑正確
import { SecFATool, IFactorCheckTool } from "~/shared/2FATool"; // 確保路徑正確
// 移除 getCorrectUser 的導入
// import { getCorrectUser } from "~/server/DataFixer/UserInformationFixer";
import { Mutex } from "async-mutex";
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler";

// 1. 定義解密後請求體的 Zod Schema
const VerifyPasswordSchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
  current_password_sha3_256: z.string(),
  current_password_sha3_384: z.string(),
});
type TVerifyPasswordRequest = z.infer<typeof VerifyPasswordSchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
  const dbConnector: MongoDBConnector = new MongoDBConnector();
  const twoFATool: IFactorCheckTool = SecFATool();

  const body = await readBody(event);
  const req = EncryptReqShema.safeParse(body);


  if (!req.success) {
    console.error("Invalid request body structure:", req.error);
    return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
  }

  let shared: string | undefined;
  let decryptedData: TVerifyPasswordRequest | undefined;

  try {


    // 2. 解密和驗證請求
    try {
      const parsedDecrypt = await IncomingReqEncryptionHandler(event, VerifyPasswordSchema)
      decryptedData = parsedDecrypt
      shared = GetSharedKeyHandler(body)
      
    } catch (error) {
      throw InvalidError()
    }
        // 3. 驗證 Token
        let jwtPayload ;
        let pasetoPayload ;
    
    try {
      jwtPayload = await verifyJWT(decryptedData.jwt);
      pasetoPayload = await verifyToken(decryptedData.paseto);
      if (!jwtPayload || jwtPayload.CUUID !== decryptedData.CUUID) throw new Error("Invalid or expired JWT.");
      if (!pasetoPayload || pasetoPayload.CUUID !== decryptedData.CUUID) throw new Error("Invalid or expired Paseto token.");
    } catch (error) {
       throw createError("token invalid!")
    }


    // 4. 連接資料庫並直接驗證密碼雜湊
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
    await dbConnector.dbConnsOpen(dbNames);
    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();
    if (connections.length < threshold) throw new Error("Not enough database connections.");

    let passwordMatchCount = 0;
    const fetchMutex = new Mutex(); // 用於安全地增加計數器

    await Promise.all(connections.map(async (conn) => {
      try {
        const userModel = conn.model<IUser>("user", userSchema);
        // 只查詢需要的密碼雜湊字段
        const userHashes = await userModel.findOne({ CUUID: decryptedData!.CUUID })
          .select('sha3_256 sha3_384') // 只選擇密碼字段
          .lean(); // 使用 lean() 提高性能

        if (userHashes &&
          userHashes.sha3_256 === decryptedData!.current_password_sha3_256 &&
          userHashes.sha3_384 === decryptedData!.current_password_sha3_384) {
          // 如果密碼匹配，增加計數
          const release = await fetchMutex.acquire();
          try {
            passwordMatchCount++;
          } finally {
            release();
          }
        } else if (userHashes) {
          // 找到了用戶但密碼不匹配
          console.warn(`Password mismatch found in DB ${conn.name} for CUUID: ${decryptedData!.CUUID}`);
        } else {
          // 在此數據庫副本中未找到用戶
          console.warn(`User not found in DB ${conn.name} for CUUID: ${decryptedData!.CUUID}`);
        }
      } catch (dbError) {
        console.error(`Error fetching/comparing password hash from DB ${conn.name}:`, dbError);
        // 記錄錯誤，但繼續檢查其他數據庫
      }
    }));

    // 5. 判斷密碼是否驗證成功 (達到閾值)
    const isPasswordMatch = passwordMatchCount >= threshold;

    let responsePayload: object;

    if (isPasswordMatch) {
      // 6. 密碼匹配，生成全新的 2FA 密鑰和備用碼
      const newKey = twoFATool.generateKey();
      const newBackupCodes = twoFATool.generateBackupCodes(8); // 生成 8 個備用碼

      responsePayload = {
        success: true,
        newKey: newKey,
        newBackupCodes: newBackupCodes,
      };
      console.log(`Password verified for CUUID: ${decryptedData.CUUID}. New 2FA key generated.`);
    } else {
      // 密碼不匹配或匹配數量不足
      console.warn(`Incorrect password or insufficient matches (${passwordMatchCount}/${threshold}) for CUUID: ${decryptedData.CUUID}`);
      responsePayload = {
        success: false,
        message: "Incorrect password or unable to verify account.", // 提供更通用的錯誤訊息
      };
    }

    // 7. 加密回應
    const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
    return {
      success: true, // API 本身成功，業務結果在加密內容中
      iv: encryptedResponseData.iv,
      encryptedMessage: encryptedResponseData.encryptedMessage,
    };

  } catch (error: any) {
    console.error("!!! Error in verifyPasswordAndGenerateKey:", error);
    // 加密錯誤回應
    if (shared) {
      try {
        const errorPayload = { success: false, message: error.message || "An unexpected error occurred." };
        const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
        // 返回加密後的錯誤，外層 success 仍為 true
        return { success: true, iv: encryptedError.iv, encryptedMessage: encryptedError.encryptedMessage };
      } catch (encryptionError) {
        console.error("Failed to encrypt error response:", encryptionError);
        return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
      }
    } else {
      return createError({ statusCode: 500, statusMessage: "Server Error", data: error.message || "Failed to process request." });
    }
  } finally {
    // 8. 關閉資料庫連接
    await dbConnector.dbConnsClose();
  }
});
