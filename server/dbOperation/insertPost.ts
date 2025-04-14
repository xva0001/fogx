import { MongoDBConnector } from "#imports";
import { PostSchema } from "../db_data_schema/PostSchema";
import { findPostByID } from "./findPostById";
import { createSignedPostPacket } from "../utils/SignPost";
import { getThreshold, getSharePartNum } from "../utils/getShareSettings";

export async function insertPost(
    dbConnector: MongoDBConnector, 
    orgPost: {
        UUID: string;
        UserUUID: string;
        isPublic: boolean;
        iv: string;
        title: string;
        content: string;
        Image: string[];
        tags: string[];
    }
) {
    const threshold = getThreshold();
    const shareNum = getSharePartNum();
    const connections = dbConnector.getDbConnections();
    let date = new Date();

    const share = await createSignedPostPacket(
        orgPost.UUID,
        orgPost.UserUUID,
        date,
        orgPost.isPublic,
        orgPost.iv,
        orgPost.title,
        orgPost.content,
        orgPost.Image,
        orgPost.tags,
        shareNum,
        threshold
    );

    try {
        if (share.length != connections.length) {
            throw new Error("share part and connection number unmatch");
        }

        // Try insert data
        await Promise.all(connections.map(async (conn, index) => {
            const postModel = conn.model("post", PostSchema);
            const newPost = new postModel(share[index]);
            await newPost.save();
        }));

        let response: Record<string, any> = {};
        let countDBData = await findPostByID(dbConnector, orgPost.UUID);
        
        if (countDBData.counter >= threshold) {
            response["success"] = true;
        } else {
            response["success"] = false;
        }

        // Rollback if needed
        if (countDBData.counter > 0 && countDBData.counter < threshold) {
            await Promise.all(connections.map(async (conn) => {
                await conn.model("post", PostSchema).deleteMany({UUID: orgPost.UUID});
            }));
        }

        countDBData = await findPostByID(dbConnector, orgPost.UUID);
        response["rollback"] = countDBData.counter === 0;

        return response;
    } catch (error) {
        throw error;
    }
}
