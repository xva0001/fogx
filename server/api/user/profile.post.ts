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

// 驗證更新資料的Schema
const updateProfileSchema = z.object({
  username: z.string().min(4).max(40).optional(),
  email: z.string().email().optional(),
  icon:z.string().optional(),
  jwt: z.string(),
  paseto: z.string()

  //phone: z.string().optional(),
  //bio: z.string().optional()
});

export default defineEventHandler(async (event) => {
  // 獲取並驗證請求體
  const body = await readBody(event)
  const validatedData = updateProfileSchema.safeParse(body)

  if (!validatedData.success) {
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

  const CUUID = jwtPayload.CUUID


  // 連接數據庫
  const dbConnector = new MongoDBConnector()
  const dbNames = useAppConfig().db.conntion.conn_string_env_arr
  await dbConnector.dbConnsOpen(dbNames)
  const connections = dbConnector.getDbConnections()

  try {
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

    // 獲取正確的用戶數據
    const user = await getCorrectUser(userArr, problemInt)

    // 更新用戶資料
    const updatedUser = {
      ...user,
      username: validatedData.data.username || user.username,
      Email: validatedData.data.email || user.Email,
      // 添加其他需要更新的字段
    }

    // 重新分割2FA密鑰
    const key = await secrets.combine(keyShares.slice(0, getThreshold()))
    const shareArr = await secrets.share(key, getSharePartNum(), getThreshold())

    // 標準化備份代碼格式
    const backupCodes = typeof user.backupCode === "string"
      ? (user.backupCode as string).split(",")
      : user.backupCode

    // 創建簽名數據包
    const packets = await createSignedPackets(
      user.CUUID,
      updatedUser.Email,
      user.sha3_256,
      user.sha3_384,
      backupCodes,
      updatedUser.username,
      shareArr,
      user.createdDate,
      new Date(),
      user.lastestLoginDate
    )

    // 更新所有數據庫
    await Promise.all(connections.map(async (conn, index) => {
      try {
        const userModel = conn.model<IUser>("user", userSchema)
        const packet = packets[index]

        // 更新用戶資料
        const result = await userModel.updateOne(
          { CUUID },
          {
            $set: {
              Email: packet.Email,
              username: packet.username,
              keyOf2FA: packet.keyOf2FA,
              updatedDate: packet.updatedDate,
              objHash: packet.objHash,
              objSign: packet.objSign
            }
          }
        )

        if (result.modifiedCount === 0 && index < packets.length) {
          // 如果沒有更新任何文檔，可能需要創建
          await new userModel(packet).save()
        }
      } catch (error) {
        console.error(`Error updating user in DB ${conn.name}:`, error)
      }
    }))

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