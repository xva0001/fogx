import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { IPost, PostSchema } from "~/server/db_data_schema/PostSchema";
import verifyPacket from "~/server/utils/verifyPacket";

import { getThreshold } from "~/server/utils/getShareSettings";
import { cleanMongoObject } from "~/server/utils/cleanObject";
import consola from "consola";

const logger = consola.withTag("findPostByUserUUID")

export const findPostByUserUUID = async (dbConnector: MongoDBConnector, userUUID: string) => {
    const connections = dbConnector.getDbConnections()
    const threshold = getThreshold()

    const allPostsMap: Map<string, (IPost|undefined)[]> = new Map();

    // Collect posts from all DBs for the specified user
    for (const conn of connections) {
        try {
            const dbContent = await conn.model("post", PostSchema)
                .find({ UserUUID:userUUID })
                .sort({ createdDate: -1 })
                .lean();
            // logger.info(dbContent)

            for (const post of dbContent) {
                const cleanedPost = cleanMongoObject(post) as IPost;
                // Verify post (skip if verification fails)
                
                const uuid = cleanedPost.UUID;
                if (!allPostsMap.has(uuid)) {
                    allPostsMap.set(uuid, []);
                }
                if (!verifyPacket.verifyPost(cleanedPost)) {
                    logger.info(`Post verification failed for UUID: ${cleanedPost.UUID} in DB ${conn.name}`);
                    allPostsMap.get(uuid)?.push(undefined);    
                    continue;
                }
                allPostsMap.get(uuid)?.push(cleanedPost);
            }
        } catch (error) {
            console.error(`Error fetching posts from DB ${conn.name}:`, error);
        }
    }

    // Filter out groups that don't meet threshold
    const mergedResults: (IPost|undefined)[][] = [];
    for (const group of allPostsMap.values()) {
        if (group.length >= threshold) {
            mergedResults.push(group);
        }
    }

    logger.info(mergedResults.length);
    

    return {
        postGroups: mergedResults
    };
}
