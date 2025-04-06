import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { z } from "zod";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr"; // 確保路徑正確
import { calSharedKey } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import { MongoDBConnector } from "~/server/utils/mongodbConn"; // 確保路徑正確
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema"; // 確保路徑正確
import { getThreshold, getSharePartNum } from "~/server/utils/getShareSettings"; // 確保路徑正確
import { verifyJWT } from "~/server/token_validator/jwt"; // 確保路徑正確
import { verifyToken } from "~/server/token_validator/paseto"; // 確保路徑正確
import { SecFATool, IFactorCheckTool } from "~/shared/2FATool"; // 確保路徑正確
import { secrets } from "easy-shamir-secret-sharing"; // 如果 updateUser 內部處理分片，這裡可能不需要
import { updateUser } from "~/server/dbOperation/updateUser"; // 確保路徑正確
import { getCorrectUser } from "~/server/DataFixer/UserInformationFixer"; // 確保路徑正確
import { Mutex } from "async-mutex";

// 1. 定義解密後請求體的 Zod Schema
const ConfirmNew2FASchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  CUUID: z.string().uuid(),
  newKey: z.string(), // 新的 2FA 密鑰 (未分片)
  newBackupCodes: z.array(z.string()), // 新的備用碼
  code: z.string().length(6).regex(/^\d{6}$/), // 用戶輸入的 6 位數驗證碼
});
type TConfirmNew2FARequest = z.infer<typeof ConfirmNew2FASchema>;

export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
  const body = await readBody(event);
  const req = EncryptReqShema.safeParse(body);
  const dbConnector: MongoDBConnector = new MongoDBConnector();
  const twoFATool: IFactorCheckTool = SecFATool();

  if (!req.success) {
    console.error("Invalid request body structure:", req.error);
    return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
  }

  let shared: string | undefined;
  let decryptedData: TConfirmNew2FARequest | undefined;

  try {
    // 2. 解密和驗證請求
    shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
    if (!shared) throw new Error("Failed to calculate shared key.");

    const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
    const parsedDecrypt = ConfirmNew2FASchema.safeParse(JSON.parse(decrypt));
    if (!parsedDecrypt.success) {
      console.error("Invalid decrypted data structure:", parsedDecrypt.error);
      throw new Error("Invalid decrypted data format.");
    }
    decryptedData = parsedDecrypt.data;

    // 3. 驗證 Token
    const jwtPayload = await verifyJWT(decryptedData.jwt);
    const pasetoPayload = await verifyToken(decryptedData.paseto);
    if (!jwtPayload || jwtPayload.CUUID !== decryptedData.CUUID) throw new Error("Invalid or expired JWT.");
    if (!pasetoPayload || pasetoPayload.CUUID !== decryptedData.CUUID) throw new Error("Invalid or expired Paseto token.");

    // 4. 驗證用戶輸入的 6 位數驗證碼是否與 newKey 匹配
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const isValidCode = twoFATool.validator(
      decryptedData.newKey,
      decryptedData.code,
      currentCounter,
      { drift: 1 }
    );
    console.log(`Verifying code ${decryptedData.code} against new key for CUUID ${decryptedData.CUUID}. Valid: ${isValidCode}`);

    let responsePayload: object;

    if (isValidCode) {
      // 5. 驗證碼有效，準備更新資料庫
      await dbConnector.dbConnsOpen(useAppConfig().db.conntion.conn_string_env_arr);
      const connections = dbConnector.getDbConnections();
      const threshold = getThreshold();
      if (connections.length < threshold) throw new Error("Not enough database connections.");

      // 獲取當前用戶數據作為基礎
      const userArr: (IUser | undefined)[] = [];
      const problemInt: number[] = [];
      const fetchMutex = new Mutex();
      await Promise.all(connections.map(async (conn, index) => {
          try {
              const userModel = conn.model<IUser>("user", userSchema);
              const user = await userModel.findOne({ CUUID: decryptedData!.CUUID }).lean();
              const release = await fetchMutex.acquire();
              try {
                  if (user) userArr.push(user as IUser);
                  else { userArr.push(undefined); problemInt.push(index); }
              } finally { release(); }
          } catch (dbError) {
              console.error(`Error fetching user data from DB ${conn.name}:`, dbError);
              const release = await fetchMutex.acquire();
              try { userArr.push(undefined); problemInt.push(index); }
              finally { release(); }
          }
      }));
      const currentUserData = await getCorrectUser(userArr, problemInt);
      if (!currentUserData) throw new Error("Failed to retrieve current user data.");

      // 創建包含更新後 2FA 信息的新用戶對象基礎
      const updatedUserDataBase = {
          ...currentUserData,
          backupCode: decryptedData.newBackupCodes, // 使用新的備用碼
          updatedDate: new Date(), // 更新時間
          // keyOf2FA 和簽名將由 updateUser 處理
      };

      // 調用 updateUser，傳遞修正後的用戶對象和原始新密鑰
      // 假設 updateUser 函數簽名是 (connector, userObject, newRawKey, optionalLastLoginDate)
      // 並且 updateUser 內部會處理分片、重新計算 objHash 和 objSign
      const updateSuccess = await updateUser(
          dbConnector,
          updatedUserDataBase as IUser, // 傳遞更新基礎數據後的 IUser 對象
          decryptedData.newKey // 傳遞原始的新 2FA 密鑰 (string)
      );

      if (!updateSuccess) {
          throw new Error("Failed to update user 2FA details in database.");
      }

      responsePayload = { success: true };
      console.log(`New 2FA setup confirmed and saved for CUUID: ${decryptedData.CUUID}`);

    } else {
      // 驗證碼無效
      console.warn(`Invalid new 2FA code provided for CUUID: ${decryptedData.CUUID}`);
      responsePayload = {
        success: false,
        message: "Invalid 2FA code.",
      };
    }

    // 6. 加密回應
    const encryptedResponseData = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
    return {
      success: true, // API 本身成功 (即使業務邏輯失敗，也返回加密的回應)
      iv: encryptedResponseData.iv,
      encryptedMessage: encryptedResponseData.encryptedMessage,
    };

  } catch (error: any) {
    console.error("!!! Error in confirmNew2FA:", error);
    // 加密錯誤回應
    if (shared) {
      try {
        const errorPayload = { success: false, message: error.message || "An unexpected error occurred." };
        const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
        // 注意：即使是錯誤，外層結構的 success 仍為 true，真正的結果在解密後的 message 和 success 中
        return { success: true, iv: encryptedError.iv, encryptedMessage: encryptedError.encryptedMessage };
      } catch (encryptionError) {
        console.error("Failed to encrypt error response:", encryptionError);
        return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
      }
    } else {
      return createError({ statusCode: 500, statusMessage: "Server Error", data: error.message || "Failed to process request." });
    }
  } finally {
    await dbConnector.dbConnsClose();
  }
});
