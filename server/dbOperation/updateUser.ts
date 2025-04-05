import { MongoDBConnector } from "#imports";
import { secrets } from "easy-shamir-secret-sharing";
import { IUser, userSchema } from "../db_data_schema/UserSchema";
import { Mutex } from 'async-mutex';
const userUpdateMutexes = new Map<string, Mutex>();
export async function updateUser(dbConnector: MongoDBConnector, correctUser: IUser, reconstructedKey: string, lastestLoginDate?: Date): Promise<boolean> {



    let mutex = userUpdateMutexes.get(correctUser.CUUID);
    if (!mutex) {
        mutex = new Mutex();
        userUpdateMutexes.set(correctUser.CUUID, mutex);
    }

    // 獲取鎖
    const release = await mutex.acquire();
    try {
        let totalConnections = dbConnector.getDbConnections().length

        let connections = dbConnector.getDbConnections()

        let threshold = getThreshold()
        // Update key share with improved rollback mechanism
        let ks = await secrets.share(reconstructedKey, getSharePartNum(), threshold);
        let packets = await createSignedPackets(
            correctUser.CUUID,
            correctUser.Email,
            correctUser.sha3_256,
            correctUser.sha3_384,
            correctUser.backupCode,
            correctUser.username,
            ks,
            correctUser.createdDate, 
            undefined, lastestLoginDate || undefined
        );

        console.log("Generated packets:", packets);

        // Phase 1: Backup original data from all connections
        const backups: { connName: string; originalData: any }[] = [];
        try {
            // First backup all original data
            await Promise.all(connections.map(async (conn) => {
                try {
                    const userModel = conn.model<IUser>("user", userSchema);
                    const originalData = await userModel.findOne({ CUUID: correctUser.CUUID }).lean();
                    if (!originalData) {
                        throw new Error(`Original data not found for CUUID: ${correctUser.CUUID}`);
                    }
                    backups.push({ connName: conn.name, originalData:originalData });
                } catch (error) {
                    console.error(`Failed to backup data from ${conn.name}:`, error);
                    throw error; // Abort if backup fails
                }
            }));
            const successfulBackups = backups.length;
            if (successfulBackups < threshold) {
                console.error(`Backup phase failed: Only ${successfulBackups}/${threshold} successful backups`);
                throw new Error(`Insufficient backups (${successfulBackups}) for threshold (${threshold})`);
            }
            console.log(`Backup phase completed: ${successfulBackups}/${totalConnections} successful`);


            // Phase 2: Perform updates with verification
            const errors: { connName: string; error: Error }[] = [];

            await Promise.all(connections.map(async (conn, index) => {
                try {
                    const userModel = conn.model<IUser>("user", userSchema);
                    const packet = packets[index];

                    // Update or insert the document
                    const updateResult = await userModel.updateOne(
                        { CUUID: correctUser.CUUID },
                        { $set: packet },
                        { upsert: true, strict: false }
                    );
                    // Verification
                    const updatedDoc = await userModel.findOne({ CUUID: correctUser.CUUID }).lean();
                    if (!updatedDoc) {
                        throw new Error("Document not found after update");
                    }

                    const cleanObj = cleanMongoObject(updatedDoc) as IUser;
                    if (cleanObj == null) {
                        throw new Error("db data lost ")
                    }
                    const cal_hash = sha3_256_userHash(cleanObj);

                    const expected_hash = sha3_256_userHash(packet);

                    if (cal_hash !== expected_hash) {
                        console.error(`Hash mismatch for ${conn.name}:`, {
                            calculated: cal_hash,
                            expected: expected_hash,
                            cleanObj,
                            packet
                        });
                        throw new Error(`Hash verification failed for ${conn.name}`);
                    }

                    console.log(`Successfully updated ${conn.name}`);

                } catch (error) {
                    console.error(`Failed to update on DB ${conn.name}:`, error);
                    errors.push({ connName: conn.name, error: error as Error });
                }
            }));


            // 檢查更新階段是否滿足閾值
            const successfulUpdates = totalConnections - errors.length;
            if (successfulUpdates < threshold) {
                console.error(`❌ Update phase failed: Only ${successfulUpdates}/${threshold} successful updates`);
                console.log("⚠️ Proceeding to Phase 3: Rollback");
            } else {
                console.log(`✅ Update phase completed: ${successfulUpdates}/${totalConnections} successful`);
                console.log("🏁 All operations completed successfully");
                //return; // 成功完成，直接返回
                return true
            }

            // Phase 3: Rollback if any errors occurred
            if (errors.length > 0) {
                console.error("⚠️ Errors occurred during update, initiating rollback...");
                const rollbackTargets = backups.filter(backup =>
                    !errors.some(e => e.connName === backup.connName)
                );
                const rollbackResults = await Promise.all(rollbackTargets.map(async (backup) => {
                    try {
                        const conn = connections.find(c => c.name === backup.connName);
                        if (!conn) {
                            console.error(`Connection not found: ${backup.connName}`);
                            return { connName: backup.connName, success: false };
                        }

                        const userModel = conn.model<IUser>("user", userSchema);
                        await userModel.updateOne(
                            { CUUID: correctUser.CUUID },
                            { $set: backup.originalData },
                            { strict: false }
                        );
                        return { connName: backup.connName, success: true };
                    } catch (rollbackError) {
                        console.error(`Rollback failed for ${backup.connName}:`, rollbackError);
                        return { connName: backup.connName, success: false };
                    }
                }));
                const failedRollbacks = rollbackResults.filter(r => !r.success);
                if (failedRollbacks.length > 0) {
                    console.error("Critical: Failed to rollback these connections:", failedRollbacks);
                    throw new Error(`Update failed and rollback incomplete for ${failedRollbacks.length} connections`);
                }
                throw new Error(`Update failed, rollback completed for ${rollbackResults.length} connections`);
            }

            console.log("✅ All update operations completed successfully");
            return true
        } catch (error) {
            console.error("Critical error in key share update process:", error);
            throw error; // Re-throw for upper level handling
        }
    } catch (error) {
        throw error

    } finally {
        release();
    }
}