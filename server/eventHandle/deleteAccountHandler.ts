import "h3"
import { H3Event } from "h3"
import { IncomingReqEncryptionHandler } from "./EncrytionHandler/IncomingEncryptionHandler"
import { generalTokenSchema } from "../request_sheme/general/generalTokenSchema"
import { verifyJWT } from "../token_validator/jwt"
import { verifyToken } from "../token_validator/paseto"
import { userSchema } from "../db_data_schema/UserSchema"

//new coding style

export const deleteAccountHandler = async (event: H3Event) => {
    let res
    try {
        res = await IncomingReqEncryptionHandler(event, generalTokenSchema)
    } catch (error) {
        return {
            success: false,
            message: error
        }
    }
    let jwtPayload
    let pasetoPayload
    try {
        jwtPayload = await verifyJWT(res.jwt)
        pasetoPayload = await verifyToken(res.paseto)
    } catch (error) {
        return {
            success: false,
            message: 'Invalid authentication tokens'
        }
    }

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
    try {
        const connections = dbConnector.getDbConnections()
        let connNum = connections.length
        let countCum = 0
        for (let index = 0; index < connNum; index++) {
            const conn = connections[index];
            let deleted = await conn.model("user", userSchema).deleteOne({ CUUID: CUUID })
            if (deleted.deletedCount == 1) {
                countCum++
            }
        }
        if (countCum == connNum || countCum >= getThreshold()) {
            return {
                success: true
            }
        } else {
            return {
                success: false
            }
        }

    } catch (error) {
        return {
            success: false
        }
    } finally {
        await dbConnector.dbConnsClose()
    }
}