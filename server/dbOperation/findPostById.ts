import { MongoDBConnector } from "#imports";
import { PostSchema } from "../db_data_schema/PostSchema";

export async function findPostByID(dbConnector: MongoDBConnector, uuid: string) {
    const connections = dbConnector.getDbConnections();
    let problemInt: number[] = []
    let contents = new Array(connections.length);

    await Promise.all(connections.map(async (conn, index) => {
        let dbContent = await conn.model("post", PostSchema).findOne({UUID: uuid}).lean();
        if (dbContent) {

            if (!verifyPacket.verifyPost(dbContent)) {
                contents[index] = undefined;
                return;            
            }
            contents[index] = dbContent;
        } else {
            contents[index] = undefined;
        }
    }));

    let counter = 0;
    for (let index = 0; index < contents.length; index++) {
        const element = contents[index];
        if (element) {
            counter++;
        }else {
            problemInt.push(index)
        }
    }
    return {contents, counter,problemInt};
}
