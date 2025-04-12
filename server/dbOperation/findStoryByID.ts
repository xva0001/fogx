import { MongoDBConnector } from "#imports";
import { StorySchema } from "../db_data_schema/StorySchema";


export async function findStoryByID(dbConnector:MongoDBConnector,uuid:string){

    const connections = dbConnector.getDbConnections()

    let contents = new Array(connections.length)

    await Promise.all(connections.map(async(conn,index)=>{

        let dbContent = await conn.model("story",StorySchema).findOne({UUID:uuid}).lean()
        if (dbContent) {
            contents[index] = dbContent
        } else {
            contents[index] = undefined
        }
    }))

    let counter = 0
    for (let index = 0; index < contents.length; index++) {
        const element = contents[index];
        if (element) {
            counter++
        }
    }

    return {contents, counter}


}