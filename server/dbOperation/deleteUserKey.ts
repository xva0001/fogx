import { MongoDBConnector } from "#imports";
import UserKeyShema from "../db_data_schema/UserKeyShema";
import { getThreshold } from "../utils/getShareSettings";

export const deleteUserKey = async (
    dbConnector: MongoDBConnector,
    userUUID: string
): Promise<boolean> => {
    if (!userUUID) {
        throw new Error('userUUID cannot be null or undefined');
    }

    const connections = dbConnector.getDbConnections();
    const threshold = getThreshold();

    const backups: { connName: string; keyData: any | null }[] = [];
    try {
        // Phase 1: Backup each user key document
        for (const conn of connections) {
            const keyModel = conn.model("userKey", UserKeyShema);
            const key = await keyModel.findOne({ UUID: userUUID }).lean();
            backups.push({ connName: conn.name, keyData: key });
        }

        // Check backup status
        let allUndefined = true;
        let undefinedCount = 0;
        let successfulBackups = 0;
        for (const backup of backups) {
            if (backup.keyData === null) {
                undefinedCount++;
            } else {
                successfulBackups++;
                allUndefined = false;
            }
        }

        if (allUndefined) {
            throw new Error('User key does not exist in any connection');
        }

        // Check threshold conditions
        if (undefinedCount > threshold) {
            console.log(`Undefined count ${undefinedCount} exceeds threshold ${threshold}. Proceeding without rollback.`);
        } else if (successfulBackups < threshold) {
            console.error(`Backup failed: Only ${successfulBackups}/${threshold} backups succeeded.`);
            return false;
        }

        // Phase 2: Delete the user key in all connections
        const deletePromises: Promise<boolean>[] = [];
        for (const conn of connections) {
            const keyModel = conn.model("userKey", UserKeyShema);
            deletePromises.push(keyModel.deleteOne({ UUID: userUUID }).then(() => true));
        }

        const deleteResults = await Promise.allSettled(deletePromises);
        const successfulDeletes = deleteResults.filter(r => r.status === 'fulfilled').length;

        if (successfulDeletes >= threshold) {
            console.log("Delete succeeded in enough connections. Proceeding.");
            return true;
        } else {
            console.log("Delete did not meet threshold. Initiating rollback.");
        }

        // Phase 3: Rollback - restore the user key where deletion succeeded
        await Promise.all(connections.map(async (conn, index) => {
            const backup = backups[index];
            if (!backup.keyData) return;
            try {
                const keyModel = conn.model("userKey", UserKeyShema);
                await keyModel.insertMany([backup.keyData]);
            } catch (error) {
                console.error(`Rollback failed for ${conn.name}:`, error);
            }
        }));

        return false;
    } catch (error) {
        console.error("Error in deleteUserKey:", error);
        return false;
    }
}
