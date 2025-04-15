import { MongoDBConnector } from "#imports";
import { IPost, PostSchema } from "~/server/db_data_schema/PostSchema";
import { Mutex } from 'async-mutex';
import { sha3_256_postHash } from "~/server/utils/HashedPost";
import { createSignedPostPacket } from "~/server/utils/SignPost";
import { cleanMongoObject } from "~/server/utils/cleanObject";

const postUpdateMutexes = new Map<string, Mutex>();

export async function updatePost(
    dbConnector: MongoDBConnector,
    correctUser: IPost,
    updatedFields: Partial<IPost>
): Promise<boolean> {
    let mutex = postUpdateMutexes.get(correctUser.UUID);
    if (!mutex) {
        mutex = new Mutex();
        postUpdateMutexes.set(correctUser.UUID, mutex);
    }

    const release = await mutex.acquire();
    try {
        const totalConnections = dbConnector.getDbConnections().length;
        const connections = dbConnector.getDbConnections();
        const threshold = getThreshold();

        // Create new post packet with updated fields
        const updatedPost = {
            ...correctUser,
            ...updatedFields,
        };

        const packets = await createSignedPostPacket(
            updatedPost.UUID,
            updatedPost.UserUUID,
            updatedPost.createdDate,
            updatedPost.isPublic,
            updatedPost.iv || "",
            updatedPost.title[0],
            updatedPost.content[0],
            updatedPost.Image || [],
            updatedPost.tags || [],
            getSharePartNum(),
            threshold
        );

        // Phase 1: Backup original data
        const backups: { connName: string; originalData: any }[] = [];
        await Promise.all(connections.map(async (conn) => {
            try {
                const postModel = conn.model<IPost>("post", PostSchema);
                const originalData = await postModel.findOne({ UUID: correctUser.UUID }).lean();
                if (!originalData) {
                    throw new Error(`Original post not found for UUID: ${correctUser.UUID}`);
                }
                backups.push({ connName: conn.name, originalData });
            } catch (error) {
                console.error(`Failed to backup data from ${conn.name}:`, error);
                throw error;
            }
        }));

        if (backups.length < threshold) {
            throw new Error(`Insufficient backups (${backups.length}) for threshold (${threshold})`);
        }

        // Phase 2: Perform updates
        const errors: { connName: string; error: Error }[] = [];
        await Promise.all(connections.map(async (conn, index) => {
            try {
                const postModel = conn.model<IPost>("post", PostSchema);
                const packet = packets[index];

                const updateResult = await postModel.updateOne(
                    { UUID: correctUser.UUID },
                    { $set: packet },
                    { upsert: false, strict: false }
                );

                // Verify update
                const updatedDoc = await postModel.findOne({ UUID: correctUser.UUID }).lean();
                if (!updatedDoc) {
                    throw new Error("Post not found after update");
                }

                const cleanObj = cleanMongoObject(updatedDoc) as IPost;
                if (!cleanObj) {
                    throw new Error("DB data lost");
                }

                const calHash = sha3_256_postHash(cleanObj);
                const expectedHash = sha3_256_postHash(packet);
                if (calHash !== expectedHash) {
                    throw new Error(`Hash verification failed for ${conn.name}`);
                }
            } catch (error) {
                console.error(`Failed to update on DB ${conn.name}:`, error);
                errors.push({ connName: conn.name, error: error as Error });
            }
        }));

        let rollbackResults: { connName: string; success: boolean }[] = [];
        const successfulUpdates = totalConnections - errors.length;
        if (successfulUpdates < threshold) {
            console.error(`Update phase failed: Only ${successfulUpdates}/${threshold} successful updates`);
            
            // Phase 3: Rollback if needed
            if (errors.length > 0) {
                const rollbackTargets = backups.filter(backup => 
                    !errors.some(e => e.connName === backup.connName)
                );

                rollbackResults = await Promise.all(rollbackTargets.map(async (backup) => {
                    try {
                        const conn = connections.find(c => c.name === backup.connName);
                        if (!conn) {
                            console.error(`Connection not found: ${backup.connName}`);
                            return { connName: backup.connName, success: false };
                        }

                        const postModel = conn.model<IPost>("post", PostSchema);
                        await postModel.updateOne(
                            { UUID: correctUser.UUID },
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
                    throw new Error(`Update failed and rollback incomplete for ${failedRollbacks.length} connections`);
                }
            }
            throw new Error(`Update failed, rollback completed for ${rollbackResults.length || 0} connections`);
        }

        return true;
    } finally {
        release();
    }
}