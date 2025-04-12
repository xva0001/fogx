import { MongoDBConnector } from "#imports";
import { object } from "zod";
import { IStory, StorySchema } from "../db_data_schema/StorySchema";
import { findStoryByID } from "./findStoryByID";


export async function InsertStory(dbConnector:MongoDBConnector, orgStory : IStory,base64ImgString:string ) {
    
    const threshold = getThreshold()

    const shareNum = getSharePartNum()

    const connections = dbConnector.getDbConnections()
    let date = new Date()
    
    const share = await createSignedStoryPackets(
        orgStory.UUID,
        orgStory.UserUUID,
        date,orgStory.isPublic,
        orgStory.iv,
        base64ImgString,
        shareNum,
        threshold
    )

    try {
        if (share.length != connections.length) {
            throw  new Error("share part and connection number unmatch")
        }
        //try insert data
        await Promise.all(connections.map(async(conn,index)=>{
            const storyModel = conn.model("story",StorySchema)   
            const newStory = new storyModel(share[index])
            await newStory.save();
        }));

        let response :Record<string,any> = {}
        let countDBData = await findStoryByID(dbConnector,orgStory.UUID)
        if (countDBData.counter >= threshold) {
            response["success"] = true
        }else{
            response["success"] = false
        }

        //rollback
        if (countDBData.counter>0 && countDBData.counter< threshold) {
            await Promise.all(connections.map(async(conn,index)=>{
                const storyModel = await conn.model("story",StorySchema).deleteMany({UUID:orgStory.UUID})
            }))

        }
        countDBData = await findStoryByID(dbConnector,orgStory.UUID)
        if (countDBData.counter==0) {
            response["rollback"] = true
        }else{
            response["rollback"] = false
        }
        return response

    } catch (error) {
        
        throw error
    }
    
}