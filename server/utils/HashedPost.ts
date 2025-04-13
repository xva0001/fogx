import pkg from "js-sha3";
import { IPost } from "~/server/db_data_schema/PostSchema";

const { sha3_256 } = pkg;

export const sha3_256_postHash = (obj: IPost): string => {

    const cleanPacket: Partial<IPost> = {
        UUID: obj.UUID,
        UserUUID: obj.UserUUID,
        createdDate: obj.createdDate,
        isPublic: obj.isPublic,
        iv: obj.iv,
        title: obj.title,
        content: obj.content,
        Image: obj.Image,
        tags: obj.tags,
        objHash: "",
        objSign: ""
    };

    const stringifiedPacket = JSON.stringify(cleanPacket);
    return sha3_256(stringifiedPacket);
}
