import { defineEventHandler, createError, readBody } from 'h3'
import { verifyJWT } from '~/server/token_validator/jwt'
import { verifyToken } from '~/server/token_validator/paseto'
import { MongoDBConnector } from '~/server/utils/mongodbConn'
import { IUser, userSchema } from '~/server/db_data_schema/UserSchema'
import { getThreshold } from '~/server/utils/getShareSettings'
import { cleanMongoObject } from '~/server/utils/cleanObject'
import { getCorrectUser } from '~/server/DataFixer/UserInformationFixer'
import { z } from 'zod'
import RequestEncryption from '~/shared/Request/requestEncrytion'
import { EncryptReq, EncryptReqShema } from '~/shared/Request/IEncryptReq'
import InvalidError from '~/server/err/InvalidErr'
import { calSharedKey } from '~/shared/useKeyFn'

// 驗證請求體Schema
const profileRequestSchema = z.object({
  jwt: z.string(),
  paseto: z.string()
})

export default defineEventHandler(async (event) => {
  // 獲取並驗證請求體
  const body = await readBody(event)
  console.log(body);
  

  let req = EncryptReqShema.safeParse(body)
  if (!req.success) {
    return InvalidError()
  }

  
  try {
    
  let shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!)

  let decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage,shared,req.data.iv)
  const validatedData = profileRequestSchema.safeParse(JSON.parse(decrypt))
  
  if (!validatedData.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request data'
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
    
    const CUUID = jwtPayload.CUUID
    
    // 連接數據庫
    const dbConnector = new MongoDBConnector()
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr
    await dbConnector.dbConnsOpen(dbNames)
    const connections = dbConnector.getDbConnections()
    
    try {
      // 從所有數據庫獲取用戶數據
      const userArr: (IUser|undefined)[] = []
      const problemInt: number[] = []
      
      await Promise.all(connections.map(async (conn, index) => {
        try {
          const userModel = conn.model<IUser>("user", userSchema)
          const userInfo = await userModel.findOne({ CUUID }).lean()
          
          if (userInfo) {
            userArr.push(cleanMongoObject(userInfo) as IUser)
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
      
      // 獲取正確的用戶數據
      const user = await getCorrectUser(userArr, problemInt)
      
      let packet = {
        success: true,
        user: {
          username: user.username,
          email: user.Email,
          icon: user.icon  || null ,
          twoFactorEnabled: true, // 由於系統要求2FA，這裡默認為true
          createdDate: user.createdDate,
          lastestLoginDate: user.lastestLoginDate,
          // 不要返回敏感字段如密碼哈希等
        }
      }

      // 返回前端所需的用戶數據
      let encrypted = RequestEncryption.encryptMessage(JSON.stringify(packet),shared)

      console.log("success send data");
      
      return encrypted
    } finally {
      await dbConnector.dbConnsClose()
    }
  } catch (error) {
    console.error('Error in user profile API:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})
