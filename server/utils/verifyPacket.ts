import SignMessage from "~/shared/Request/signMessage";
import { IStory } from "../db_data_schema/StorySchema";
import { IUser } from "../db_data_schema/UserSchema";

class verifyPacket{

    // static verifyHashUserPacket(data:IUser,userHash:string):boolean{

    //     let orgHash = sha3_256_userHash(data)
    //     if (!(orgHash==userHash)) {
    //         console.log("Hash inconsistant from verifyPacket. verifyHashUserPacket")
    //         return false
    //     }else{
    //         return true
    //     }
    // }

    static  verifyStory(story:IStory):boolean{
        let orgHash =  sha3_256_storyHash(story)
        try{
        let res =SignMessage.verify(
            process.env.EDDSA_SIGN_PUBLIC_KEY!,
            story.objSign,
            String(story.objHash)
        )
        return res
        }catch{
            return false
        }
    }

}

export default verifyPacket