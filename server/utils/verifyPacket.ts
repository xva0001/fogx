import pkg from "js-sha3";
import { sha3_256_userHash } from "~/server/utils/HashedUser";
import { sha3_256_storyHash } from "~/server/utils/HashedStory";
import SignMessage from "~/shared/Request/signMessage";
import { IStory } from "../db_data_schema/StorySchema";
import { IUser } from "../db_data_schema/UserSchema";
import { IPost } from "../db_data_schema/PostSchema";
import consola from "consola";
import { sha3_256_userKeyHash } from "./HashedUserKey";
import { IUserKey } from "../db_data_schema/UserKeyShema";
import { sha3_256_messageHash } from "./HashedMessage";
import { IMessage } from "../db_data_schema/MessageShema";

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
   static verifyPost(post : IPost,publicKey: string = process.env.EDDSA_SIGN_PUBLIC_KEY!) : boolean {
    if (!publicKey) {
        console.error("Public key for story verification is missing.");
           return false;
    }

    try {
        
        const calculatedHash = sha3_256_postHash(post)

        if (calculatedHash != post.objHash) {
            consola.warn(`Post ${post.UUID} - org hash is ${post.objHash}, calculated hash : ${calculatedHash}: unmatch`)
            return false;
        }

        const isSignValid = SignMessage.verify(publicKey,post.objSign,String(post.objHash))

        if (!isSignValid) {
            consola.warn(`Post ${post.UUID} - org hash is ${post.objHash}, calculated hash : ${calculatedHash} : sign failed `)
        }
        return isSignValid


    } catch (error) {
        
        consola.error(this.name+" : "+error)
        return false

    }

   }


   static verifyUserKey(userKey: IUserKey, publicKey: string = process.env.EDDSA_SIGN_PUBLIC_KEY!): boolean {
        if (!publicKey) {
            console.error("Public key for user key verification is missing");
            return false;
        }
        try {
            const calculatedHash = sha3_256_userKeyHash(userKey);
            if (calculatedHash !== userKey.objHash) {
                console.warn(`User key hash mismatch for UUID ${userKey.UUID}. Calculated: ${calculatedHash}, Stored: ${userKey.objHash}`);
                return false;
            }

            const isSignValid = SignMessage.verify(
                publicKey,
                userKey.objSign,
                String(userKey.objHash)
            );

            if (!isSignValid) {
                console.warn(`User key signature verification failed for UUID ${userKey.UUID}`);
            }

            return isSignValid;
        } catch (error) {
            console.error(`Error during user key verification for UUID ${userKey.UUID}:`, error);
            return false;
        }
    }

    static verifyMessage(message: IMessage, publicKey: string = process.env.EDDSA_SIGN_PUBLIC_KEY!): boolean {
        if (!publicKey) {
            console.error("Public key for message verification is missing");
            return false;
        }
        try {
            const calculatedHash = sha3_256_messageHash(message);
            if (calculatedHash !== message.objHash) {
                console.warn(`Message hash mismatch for sender ${message.sender_UUID}. Calculated: ${calculatedHash}, Stored: ${message.objHash}`);
                return false;
            }

            const isSignValid = SignMessage.verify(
                publicKey,
                message.objSign,
                String(message.objHash)
            );

            if (!isSignValid) {
                console.warn(`Message signature verification failed for sender ${message.sender_UUID}`);
            }

            return isSignValid;
        } catch (error) {
            console.error(`Error during message verification for sender ${message.sender_UUID}:`, error);
            return false;
        }
    }



}

export default verifyPacket
