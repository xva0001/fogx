import pkg from "js-sha3"
import { IStory } from "~/server/db_data_schema/StorySchema"


const {sha3_256} = pkg

export const sha3_256_storyHash  = (obj:IStory)=>{

    const cleanPacket : Partial<IStory> = {
        UUID: obj.UUID,
        UserUUID: obj.UserUUID,
        createdDate:obj.createdDate,
        isPublic:obj.isPublic,
        iv:obj.iv,
        Image:obj.Image,
        objHash:"",
        objSign:""
    }

    return sha3_256(JSON.stringify(cleanPacket))

}