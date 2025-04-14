import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { IPost, PostSchema } from "~/server/db_data_schema/PostSchema";
import verifyPacket from "~/server/utils/verifyPacket";

export const findPublicPost = async (dbConnector: MongoDBConnector, skip = 0, limit = 20) => {
    const connections = dbConnector.getDbConnections()
    const threshold = getThreshold()

    const allPosts: IPost[] = []

    // 收集來自各個 DB 的 public posts
    for (const conn of connections) {
        const dbContent = await conn.model("post", PostSchema)
            .find({
                isPublic: true,
            })
            .sort({ createdDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        for (const post of dbContent) {
            allPosts.push(cleanMongoObject(post) as IPost)
        }
    }

    // 分組：用 UUID 當 key
    const grouped: Record<string, (IPost)[]> = {}
    for (const post of allPosts) {
        const uuid = post.UUID
        if (!grouped[uuid]) {
            grouped[uuid] = []
        }

        // 驗證 post
        let verify = verifyPacket.verifyPost(post)
        if (verify === false) {
            continue
        }

        grouped[uuid].push(post)
    }

    // 過濾掉未達 threshold 的群組
    const mergedResults: IPost[][] = []
    for (const uuid in grouped) {
        const group = grouped[uuid]
        if (group.length >= threshold) {
            mergedResults.push(group)
        }
    }
    return mergedResults
}
