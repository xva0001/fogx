import { MongoDBConnector } from "#imports";
import { IStory } from "../db_data_schema/StorySchema";


export async function InsertStory(dbConnector:MongoDBConnector, orgStory : IStory ) {
    
    const threshold = getThreshold()

    const shareNum = getSharePartNum()

    const connections = dbConnector.getDbConnections()

    

}