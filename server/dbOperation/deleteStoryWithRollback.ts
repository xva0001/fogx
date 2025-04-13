import { MongoDBConnector } from "#imports";
import { StorySchema } from "../db_data_schema/StorySchema";
import { getThreshold } from "../utils/getShareSettings";


export const deleteStoryWithRollback = async (dbConnector: MongoDBConnector, storyUUID: string, userUUID: string): Promise<boolean> => {
    // Validate parameters
    if (!storyUUID || !userUUID) {
        throw new Error('storyUUID or userUUID cannot be null or undefined');
    }

    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();

    const backups: { connName: string; storyData: any | null }[] = [];
    try {
        // Phase 1: Backup each story document
        for (const conn of connections) {
            const storyModel = conn.model("story", StorySchema);
            const story = await storyModel.findOne({ UUID: storyUUID, UserUUID: userUUID }).lean();
            backups.push({ connName: conn.name, storyData: story });
        }

        // Check all undefined condition with for loop
        let allUndefined = true;
        let undefinedCount = 0;
        let successfulBackups = 0;
        for (const backup of backups) {
            if (backup.storyData === null) {
                undefinedCount++;
            } else {
                successfulBackups++;
                allUndefined = false;
            }
        }

        // Check if all entries are undefined
        if (allUndefined) {
            throw new Error('Data does not exist in any connection');
        }

        // Check threshold conditions
        if (undefinedCount > threshold) {
            // Proceed with deletion without rollback
            console.log(`Undefined count ${undefinedCount} exceeds threshold ${threshold}. Proceeding without rollback.`);
        } else {
            // Check if successful backups meet threshold
            if (successfulBackups < threshold) {
                console.error(`Backup failed: Only ${successfulBackups}/${threshold} backups succeeded.`);
                return false;
            }
        }

        // Phase 2: Delete the story in all connections
        const deletePromises: Promise<boolean>[] = [];
        for (const conn of connections) {
            const storyModel = conn.model("story", StorySchema);
            deletePromises.push(storyModel.deleteOne({ UUID: storyUUID, UserUUID: userUUID }).then(() => true));
        }

        const deleteResults = await Promise.allSettled(deletePromises);
        const successfulDeletes = deleteResults.filter(r => r.status === 'fulfilled').length;

        if (successfulDeletes >= threshold) {
            console.log("Delete succeeded in enough connections. Proceeding.");
            return true;
        } else {
            console.log("Delete did not meet threshold. Initiating rollback.");
        }

        // Phase 3: Rollback - restore the story in connections where deletion succeeded
        await Promise.all(connections.map(async (conn, index) => {
            const backup = backups[index];
            if (!backup.storyData) return; // No backup, can't restore
            try {
                const storyModel = conn.model("story", StorySchema);
                await storyModel.insertMany([backup.storyData]);
            } catch (error) {
                console.error(`Rollback failed for ${conn.name}:`, error);
            }
        }));

        // After rollback, return failure
        return false;
    } catch (error) {
        console.error("Error in deleteStoryWithRollback:", error);
        return false;
    }
}
