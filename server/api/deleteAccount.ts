import { userSchema } from "../db_data_schema/UserSchema";


export default defineEventHandler(async (event) => {

    const body = await readBody(event)

    if (body.uuid && import.meta.dev) {

        const db = new MongoDBConnector()
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        await db.dbConnsOpen(dbNames)
        let connNum = db.getDbConnections().length
        let countCum = 0
        for (let index = 0; index < connNum; index++) {
            const conn = db.getDbConnections()[index];

            let Deleted = await conn.model("user", userSchema).deleteOne({ CUUID: body.uuid })
            if (Deleted.deletedCount == 1) {
                countCum++
            }
        }
        await db.dbConnsClose()
        if (countCum == countCum) {
            return {
                success: true
            }
        } else {
            return {
                success: false

            }
        }


    } else {
        return {
            success: false
        }
    }

})