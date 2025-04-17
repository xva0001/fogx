import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { IPost, PostSchema } from "~/server/db_data_schema/PostSchema";
import verifyPacket from "~/server/utils/verifyPacket";

import { getThreshold } from "~/server/utils/getShareSettings"; // 確保導入
import { cleanMongoObject } from "~/server/utils/cleanObject"; // 確保導入

export const findPublicPost = async ( dbConnector: MongoDBConnector, page: number = 1, limit: number = 10) => {
    const connections = dbConnector.getDbConnections()
    const threshold = getThreshold()
    const skip = (page - 1) * limit;

    const allPostsMap: Map<string, IPost[]> = new Map();

    // 收集來自各個 DB 的 public posts
    for (const conn of connections) {
        try {
            const dbContent = await conn.model("post", PostSchema)
                .find({ isPublic: true })
                .sort({ createdDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            for (const post of dbContent) {
                const cleanedPost = cleanMongoObject(post) as IPost;
                // 驗證 post (如果驗證失敗，可以選擇跳過或記錄)
                if (!verifyPacket.verifyPost(cleanedPost)) { // 假設 verifyPost 返回 boolean
                    console.warn(`Post verification failed for UUID: ${cleanedPost.UUID} in DB ${conn.name}`);
                    continue; // 跳過無效的 post
                }

                const uuid = cleanedPost.UUID;
                if (!allPostsMap.has(uuid)) {
                    allPostsMap.set(uuid, []);
                }
                allPostsMap.get(uuid)?.push(cleanedPost);
            }
        } catch (error) {
            console.error(`Error fetching posts from DB ${conn.name}:`, error);
            // 根據錯誤處理策略決定是否繼續
        }
    }

    // 過濾掉未達 threshold 的群組
    const mergedResults: IPost[][] = [];
    for (const group of allPostsMap.values()) {
        if (group.length >= threshold) {
            mergedResults.push(group);
        }
    }

    // 可以在這裡執行一個額外的 count 查詢，或者根據返回結果數量判斷
    // 簡單判斷：如果返回的 group 數量等於 limit，則可能還有更多
    const hasMorePages = mergedResults.length === limit;

    return {
        postGroups: mergedResults,
        hasMorePages: hasMorePages
    };
}
