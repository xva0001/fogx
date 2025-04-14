import { MongoDBConnector } from "#imports";
import { PostSchema } from "../db_data_schema/PostSchema";
import { getThreshold } from "../utils/getShareSettings";

export const deletePostWithRollback = async (
    dbConnector: MongoDBConnector, 
    postUUID: string, 
    userUUID: string
): Promise<boolean> => {
    if (!postUUID || !userUUID) {
        throw new Error('postUUID or userUUID cannot be null or undefined');
    }

    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();

    const backups: { connName: string; postData: any | null }[] = [];
    try {
        // Phase 1: Backup each post document
        for (const conn of connections) {
            const postModel = conn.model("post", PostSchema);
            const post = await postModel.findOne({ UUID: postUUID, UserUUID: userUUID }).lean();
            backups.push({ connName: conn.name, postData: post });
        }

        // Check backup status
        let allUndefined = true;
        let undefinedCount = 0;
        let successfulBackups = 0;
        for (const backup of backups) {
            if (backup.postData === null) {
                undefinedCount++;
            } else {
                successfulBackups++;
                allUndefined = false;
            }
        }

        if (allUndefined) {
            throw new Error('Post does not exist in any connection');
        }

        // Check threshold conditions
        if (undefinedCount > threshold) {
            console.log(`Undefined count ${undefinedCount} exceeds threshold ${threshold}. Proceeding without rollback.`);
        } else if (successfulBackups < threshold) {
            console.error(`Backup failed: Only ${successfulBackups}/${threshold} backups succeeded.`);
            return false;
        }

        // Phase 2: Delete the post in all connections
        const deletePromises: Promise<boolean>[] = [];
        for (const conn of connections) {
            const postModel = conn.model("post", PostSchema);
            deletePromises.push(postModel.deleteOne({ UUID: postUUID, UserUUID: userUUID }).then(() => true));
        }

        const deleteResults = await Promise.allSettled(deletePromises);
        const successfulDeletes = deleteResults.filter(r => r.status === 'fulfilled').length;

        if (successfulDeletes >= threshold) {
            console.log("Delete succeeded in enough connections. Proceeding.");
            return true;
        } else {
            console.log("Delete did not meet threshold. Initiating rollback.");
        }

        // Phase 3: Rollback - restore the post where deletion succeeded
        await Promise.all(connections.map(async (conn, index) => {
            const backup = backups[index];
            if (!backup.postData) return;
            try {
                const postModel = conn.model("post", PostSchema);
                await postModel.insertMany([backup.postData]);
            } catch (error) {
                console.error(`Rollback failed for ${conn.name}:`, error);
            }
        }));

        return false;
    } catch (error) {
        console.error("Error in deletePostWithRollback:", error);
        return false;
    }
}
