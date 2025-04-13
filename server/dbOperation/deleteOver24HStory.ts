import { MongoDBConnector } from "#imports";
import { StorySchema } from "../db_data_schema/StorySchema";

export const deleteOver24HStory = async (dbConnector: MongoDBConnector) => {
    const connections = dbConnector.getDbConnections();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const conn of connections) {
        await conn.model("story", StorySchema)
            .deleteMany({
                createdDate: { $lt: twentyFourHoursAgo }
            });
    }
    if (connections.length >=getThreshold()) {
        console.log("deleted over 24 hours Story ok");
    }else{
        console.log("deleted over 24 hours Story failed");
    }
};
