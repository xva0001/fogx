import { defineEventHandler, createError, getHeaders, readBody } from 'h3'
import { z } from 'zod'
import { verifyJWT } from '~/server/token_validator/jwt'
import { verifyToken } from '~/server/token_validator/paseto'
import { MongoDBConnector } from '~/server/utils/mongodbConn'
import { IUser, userSchema } from '~/server/db_data_schema/UserSchema'
import { createSignedPackets } from '~/server/utils/SignIUser'
import { secrets } from 'easy-shamir-secret-sharing'
import { getThreshold, getSharePartNum } from '~/server/utils/getShareSettings'
import { cleanMongoObject } from '~/server/utils/cleanObject'
import { getCorrectUser } from '~/server/DataFixer/UserInformationFixer'
import { Mutex } from 'async-mutex'
import { Connection } from 'mongoose'
import { updateUser } from '~/server/dbOperation/updateUser'
import { EncryptReqShema } from '~/shared/Request/IEncryptReq'
import { calSharedKey } from '~/shared/useKeyFn'
import InvalidError from '~/server/err/InvalidErr'
import RequestEncryption from '~/shared/Request/requestEncrytion'
import consola from 'consola'

/**
 * 檢查字段是否已存在於其他用戶
 * @param connections 數據庫連接
 * @param fieldName 要檢查的字段名
 * @param fieldValue 要檢查的字段值 
 * @param excludeCUUID 要排除的用戶CUUID
 * @returns 如果已存在返回true，否則false
 */
async function checkFieldExists(
  connections: Connection[],
  fieldName: string,
  fieldValue: string,
  excludeCUUID: string
): Promise<boolean> {
  const mutex = new Mutex();
  let exists = false;

  await Promise.all(connections.map(async (conn) => {
    const count = await conn.model("user", userSchema).countDocuments({
      [fieldName]: fieldValue,
      CUUID: { $ne: excludeCUUID }
    });
    if (count > 0) {
      const release = await mutex.acquire();
      try {
        exists = true;
      } finally {
        release();
      }
    }
  }));

  return exists;
}

// 驗證更新資料的Schema
const updateProfileSchema = z.object({
  username: z.string().min(4).max(40).optional(),
  email: z.string().email().optional(),
  icon: z.string().optional(),
  jwt: z.string(),
  paseto: z.string()

  //phone: z.string().optional(),
  //bio: z.string().optional()
});

export default defineEventHandler(async (event) => {



  // 獲取並驗證請求體
  const body = await readBody(event)
  //console.log(body);

  const req = EncryptReqShema.safeParse(body)

  if (!req.success) {
    return InvalidError()
  }
  let shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)

  let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage,shared,req.data.iv)


  let validatedData = updateProfileSchema.safeParse(JSON.parse(decrypt))

  if (!validatedData.success) {
    console.log("Invalid profile data");
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid profile data'
    })
  }

  // 驗證令牌
  const jwtPayload = await verifyJWT(validatedData.data.jwt)
  const pasetoPayload = await verifyToken(validatedData.data.paseto)

  if (!jwtPayload || !pasetoPayload || jwtPayload.login !== 'completed' || pasetoPayload.login !== 'completed') {
    return {
      success: false,
      message: 'Invalid authentication tokens'
    }
  }

  const CUUID: string = typeof jwtPayload.CUUID === 'string' ? jwtPayload.CUUID : (() => { throw createError({ statusCode: 400, message: 'Invalid CUUID format' }).toJSON(); })();


  // 連接數據庫
  const dbConnector = new MongoDBConnector()
  const dbNames = useAppConfig().db.conntion.conn_string_env_arr
  await dbConnector.dbConnsOpen(dbNames)
  const connections = dbConnector.getDbConnections()

  try {
    // 檢查email和username是否已存在
    if (validatedData.data.email) {
      const emailExists = await checkFieldExists(
        connections,
        'Email',
        validatedData.data.email,
        CUUID
      );
      if (emailExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Email already exists'
        });
      }
    }
    const newEmail = validatedData.data.email

    if (validatedData.data.username) {
      const usernameExists = await checkFieldExists(
        connections,
        'username',
        validatedData.data.username,
        CUUID
      );
      if (usernameExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Username already exists'
        });
      }
    }
    const newUsername = validatedData.data.username


    // 從所有數據庫獲取用戶數據
    const userArr: (IUser | undefined)[] = []
    const problemInt: number[] = []
    const keyShares: string[] = []

    await Promise.all(connections.map(async (conn, index) => {
      try {
        const userModel = conn.model<IUser>("user", userSchema)
        const userInfo = await userModel.findOne({ CUUID }).lean()

        if (userInfo) {
          userArr.push(cleanMongoObject(userInfo) as IUser)
          keyShares.push(userInfo.keyOf2FA)
        } else {
          userArr.push(undefined)
          problemInt.push(index)
        }
      } catch (error) {
        console.error(`Error fetching user data from DB ${conn.name}:`, error)
        userArr.push(undefined)
        problemInt.push(index)
      }
    }))

    // 確保我們有足夠的數據來還原用戶信息
    if (userArr.filter(u => u !== undefined).length < getThreshold()) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server Error',
        message: 'Could not retrieve sufficient user data'
      })
    }

    console.log(userArr);
    
    console.log(typeof userArr[0]?.createdDate);

    
    
    

    // 獲取正確的用戶數據
    const user = await getCorrectUser(userArr, problemInt)

    consola.info("correct user",user)
    consola.info("array",userArr)


    // 標準化備份代碼格式
    const backupCodes = typeof user.backupCode === "string"
      ? (user.backupCode as string).split(",")
      : user.backupCode

    // 更新用戶資料
    const updatedUser = {
      ...user,
      username: newUsername || user.username,
      Email: newEmail || user.Email,
      icon: validatedData.data.icon || "",
      backupCode: backupCodes
      // 添加其他需要更新的字段
    }
    console.log(updatedUser);
    

    // 重新分割2FA密鑰
    const key = await secrets.combine(keyShares.slice(0, getThreshold()))
    const shareArr = await secrets.share(key, getSharePartNum(), getThreshold())
    console.log("updated User : ",updatedUser);

    // 使用 updateUser 函数更新所有数据库
    // return {
    //   test :true,
    //   success :false,
    //   message:"testing now"
    // }

    const resDB = await updateUser(
      dbConnector,
      updatedUser,
      key,
      user.lastestLoginDate
    )

    if (!resDB) {
      throw new Error("Failed to update user profile")
    }

    return {
      success: true,
      message: 'Profile updated successfully'
    }
  } catch (error: any) {
    console.error('Error in update profile API:', error)
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Server Error',
      message: error.message || 'An unexpected error occurred'
    }).toJSON()
  } finally {
    await dbConnector.dbConnsClose()
  }
}
)
