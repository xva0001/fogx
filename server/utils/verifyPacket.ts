import pkg from "js-sha3";
import { sha3_256_userHash } from "~/server/utils/HashedUser";
import { sha3_256_storyHash } from "~/server/utils/HashedStory";
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

    static verifyHashUserPacket(user: IUser, publicKey: string = process.env.EDDSA_SIGN_PUBLIC_KEY!): boolean {
        if (!publicKey) {
            console.error("Public key for user verification is missing.");
            return false;
        }
        try {
            const calculatedHash = sha3_256_userHash(user);
            if (calculatedHash !== user.objHash) {
                console.warn(`User hash mismatch for CUUID ${user.CUUID}. Calculated: ${calculatedHash}, Stored: ${user.objHash}`);
                return false;
            }

            const isSignValid = SignMessage.verify(
                publicKey,
                user.objSign,
                String(user.objHash)
            );

            if (!isSignValid) {
                 console.warn(`User signature verification failed for CUUID ${user.CUUID}.`);
            }

            return isSignValid;

        } catch (error) {
            console.error(`Error during user verification for CUUID ${user.CUUID}:`, error);
            return false;
        }
    }

    static verifyStory(story: IStory, publicKey: string = process.env.EDDSA_SIGN_PUBLIC_KEY!): boolean {
        if (!publicKey) {
           console.error("Public key for story verification is missing.");
           return false;
       }
       try {
           const calculatedHash = sha3_256_storyHash(story);
           if (calculatedHash !== story.objHash) {
               console.warn(`Story hash mismatch for UUID ${story.UUID}. Calculated: ${calculatedHash}, Stored: ${story.objHash}`);
               return false;
           }

           const isSignValid = SignMessage.verify(
               publicKey,
               story.objSign,
               String(story.objHash)
           );

            if (!isSignValid) {
                console.warn(`Story signature verification failed for UUID ${story.UUID}.`);
           }

           return isSignValid;

       } catch (error) {
           console.error(`Error during story verification for UUID ${story.UUID}:`, error);
           return false;
       }
   }

}

export default verifyPacket