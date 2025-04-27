import { MongoDBConnector } from "#imports";
import UserKeyShema, { IUserKey } from "../db_data_schema/UserKeyShema";
import { createSignedUserKey as createSignedUserKeyPackets } from "../utils/signUserKey";
import { findUserKeyByUUID } from "./findUserKeyByUUID";

export async function InsertUserKey(dbConnector: MongoDBConnector, orgUserKey: IUserKey) {
    const threshold = getThreshold()
    const shareNum = getSharePartNum()
    const connections = dbConnector.getDbConnections()

    let date = new Date()

    const share = await createSignedUserKeyPackets(orgUserKey, shareNum, threshold)

    try {
        if (share.length != connections.length) {
            throw new Error("share part and connection number unmatch")
        }

        await Promise.all(connections.map(async (conn, index) => {

            const userKeyModel = conn.model("userKey", UserKeyShema)

            const newkey = new userKeyModel(share[index])
            await newkey.save()

        }))


        let countDBData = await findUserKeyByUUID(dbConnector, orgUserKey.UUID, date)
        let response: Record<string, any> = {}
        if (countDBData.counter >= threshold) {
            response["success"] = true
        } else {
            response["success"] = false
        }

        //rollback
        if (countDBData.counter >0 && countDBData.counter < threshold) {
            await Promise.all(connections.map(async(conn)=>{
                await conn.model("userKey",UserKeyShema).deleteMany({UUID:orgUserKey.UUID,createdDate:date})
            }))
        }
        countDBData = await findUserKeyByUUID(dbConnector, orgUserKey.UUID, date)

        if (countDBData.counter==0) {
            response["rollback"] = true
        }else{
            response["rollback"] = false
        }
        return response

    } catch (error) {

    }
} 