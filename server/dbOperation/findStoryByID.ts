import { cleanMongoObject, MongoDBConnector } from "#imports";
import { IStory, StorySchema } from "../db_data_schema/StorySchema";


export async function findStoryByID(dbConnector: MongoDBConnector, uuid: string) {

    const connections = dbConnector.getDbConnections()

    let contents: (IStory | undefined)[] = new Array(connections.length)

    let problemInt: number[] = []

    await Promise.all(connections.map(async (conn, index) => {

        let dbContent = await conn.model("story", StorySchema).findOne({ UUID: uuid }).lean()

        if (dbContent) {

            let cleanStory = cleanMongoObject(dbContent) as IStory

            if (!verifyPacket.verifyStory(cleanStory)) {
                contents[index] = undefined
                return
            }
            contents[index] = cleanStory
        } else {
            contents[index] = undefined
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