import { StorySchema } from "~/server/db_data_schema/StorySchema";

export default defineEventHandler(async (event) => {

    const body = await readBody(event)

    if (import.meta.dev) {


        const dbConnector = new MongoDBConnector()
        const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
        await dbConnector.dbConnsOpen(dbNames)

        let connNum = dbConnector.getDbConnections().length
        let countCum = 0

        for (let index = 0; index < connNum; index++) {
            const conn = dbConnector.getDbConnections()[index];
            let deleted = await conn.model("story", StorySchema).deleteMany({ UUID: undefined })
        }
        await dbConnector.dbConnsClose()

        return {
            success: true
        }
    }
    else {
        return {
            success: false
        }
    }


})