import { MongoDBConnector } from "#imports";
import { PostSchema } from "~/server/db_data_schema/PostSchema";
import { cleanMongoObject } from "~/server/utils/cleanObject";
import { getThreshold } from "~/server/utils/getShareSettings";

export const deletePrivatePostsOver15Days = async (
    dbConnector: MongoDBConnector
): Promise<number> => {
    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    let totalDeleted = 0;
    const backupPosts: Array<{ connName: string; postData: any }> = [];

    try {
        // Phase 1: Backup posts that will be deleted
        for (const conn of connections) {
            try {
                const postModel = conn.model("post", PostSchema);
                const postsToDelete = await postModel.find({
                    isPublic: false,
                    createdDate: { $lt: fifteenDaysAgo }
                }).lean();

                backupPosts.push({
                    connName: conn.name,
                    postData: postsToDelete
                });
            } catch (error) {
                console.error(`Error backing up posts from ${conn.name}:`, error);
            }
        }

        // Phase 2: Delete posts
        for (const conn of connections) {
            try {
                const postModel = conn.model("post", PostSchema);
                const deleteResult = await postModel.deleteMany({
                    isPublic: false,
                    createdDate: { $lt: fifteenDaysAgo }
                });

                totalDeleted += deleteResult.deletedCount;
                console.log(`Deleted ${deleteResult.deletedCount} posts from ${conn.name}`);
            } catch (error) {
                console.error(`Error deleting posts from ${conn.name}:`, error);
                // Continue with next connection
            }
        }

        // Check threshold
        if (totalDeleted < threshold) {
            console.warn(`Total deleted posts (${totalDeleted}) is below threshold (${threshold})`);
            // Rollback if threshold not met
            await rollbackDeletion(connections, backupPosts);
            return 0;
        }

        return totalDeleted;
    } catch (error) {
        console.error("Error in deletePrivatePostsOver15Days:", error);
        await rollbackDeletion(connections, backupPosts);
        return 0;
    }
};

async function rollbackDeletion(connections: any, backupPosts: Array<{ connName: string; postData: any }>) {
    console.log("Starting rollback...");
    try {
        for (const backup of backupPosts) {
            const conn = connections.find((c: any) => c.name === backup.connName);
            if (conn && backup.postData?.length > 0) {
                const postModel = conn.model("post", PostSchema);
                await postModel.insertMany(backup.postData);
                console.log(`Rollback completed for ${backup.connName}`);
            }
        }
    } catch (error) {
        console.error("Error during rollback:", error);
    }
}
