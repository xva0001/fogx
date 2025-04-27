import { MongoDBConnector } from "#imports";
import UserKeySchema, { IUserKey } from "../db_data_schema/UserKeyShema";


export async function findUserKeyByUUID(dbConnector: MongoDBConnector, userUUID: string, dateEQ?: Date, before?: Date) {


    const connections = dbConnector.getDbConnections()

    let contents: (IUserKey | undefined)[] = new Array(connections.length)

    let problemInt: number[] = []

    await Promise.all(connections.map(async (conn, index) => {

        let query: any = { UUID: userUUID };

        if (dateEQ) {
            query.createdDate = { $eq: dateEQ };
        } else if (before) {
            query.createdDate = { $lt: before };
        }

        const dbContent = await conn.model("userKey", UserKeySchema).findOne(query).lean();

        if (dbContent) {
            let cleanUserKey = cleanMongoObject(dbContent) as IUserKey

            if (!verifyPacket.verifyUserKey(cleanUserKey)) {
                contents[index] = undefined;
                return
            }
            contents[index] = cleanUserKey
        } else {
            contents[index] = undefined;
        }


    }))

    let counter = 0
    for (let index = 0; index < contents.length; index++) {
        const element = contents[index];
        if (element) {
            counter++
        } else {
            problemInt.push(index)
        }
    }

    return { contents, counter, problemInt }

}