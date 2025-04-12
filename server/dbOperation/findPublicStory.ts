import { MongoDBConnector } from "#imports";
import { IStory, StorySchema } from "../db_data_schema/StorySchema";
import verifyPacket from "../utils/verifyPacket";

export const findPublicStory = async (dbConnector: MongoDBConnector, numLimit = 20) => {
    const connections = dbConnector.getDbConnections()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const threshold = getThreshold()

    const allStories: IStory[] = []

    // 收集來自各個 DB 的 public stories
    for (const conn of connections) {
        const dbContent = await conn.model("story", StorySchema)
            .find({
                isPublic: true,
                createdDate: { $gte: twentyFourHoursAgo }
            })
            .sort({ createdDate: -1 })
            .limit(numLimit)

        for (const story of dbContent) {
            allStories.push(cleanMongoObject(story) as IStory)
        }
    }

    // 分組：用 UUID 當 key
    const grouped: Record<string, (IStory)[]> = {}
    for (const story of allStories) {
        const uuid = story.UUID
        if (!grouped[uuid]) {
            grouped[uuid] = []
        }

        //check story
        console.log(story);
        

        // let verify = verifyPacket.verifyStory(story)
        // if (verify===false) {
        //     //
        //     continue
        // }

        grouped[uuid].push(story)
    }

    // 過濾掉未達 threshold 的群組
    const mergedResults: IStory[][] = []
    for (const uuid in grouped) {
        const group = grouped[uuid]
        if (group.length >= threshold) {
            mergedResults.push(group)
        }
    }


    return mergedResults
}
