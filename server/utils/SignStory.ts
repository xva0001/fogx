import pkg from "js-sha3"
import { IStory } from "../db_data_schema/StorySchema"
import ShamirImageTool from "./imageDistrubutionTool"
import { groupByIndex } from "./ArrayGroupByIndex"
import { sha3_256_storyHash } from "./HashedStory"
import SignMessage from "~/shared/Request/signMessage"


const {sha3_256} = pkg


export async function createSignedStoryPackets(
uuid: string,
  userUUID: string,
  createdDate: Date,
  isPublic:boolean,
  iv:string,
  ImageBase64: string,
  shareNum:number,
  threshold:number
){

    const arr_packet : IStory[] = new Array(shareNum)


    const imageShares = await ShamirImageTool.splitAndShare(ImageBase64,shareNum,threshold)

    const q = await ShamirImageTool.combineShares(imageShares)

    if (sha3_256(q)!=sha3_256(ImageBase64)) {
        throw new Error("ShamirImageTool : hash result inconsistant")
    }

    const {groups:reverse}  = groupByIndex(imageShares)


    for (let index = 0; index < shareNum; index++) {
        const db_packet : IStory =
        {
            UUID:uuid,
            UserUUID:userUUID,
            createdDate:createdDate,
            isPublic:isPublic,
            iv:iv,
            Image:reverse[index],
            objHash:"",
            objSign:""
        }

        let string_packet = JSON.stringify(db_packet)
        let str_hash = sha3_256_storyHash(db_packet)
        db_packet.objHash = str_hash
        
        
        try {
            let signObj = await SignMessage.sign(
                process.env.EDDSA_SIGN_PRIVATE_KEY!,
                string_packet           //include sha3_256
            )

            if (signObj.hash != db_packet.objHash ) {
                throw new Error("sign Message Error : inconsistant hash")
            }

            db_packet.objSign = signObj.mess

        } catch (error) {
            throw error
        }
        let isValid_sign = SignMessage.verify(
            process.env.EDDSA_SIGN_PUBLIC_KEY!,
            db_packet.objSign,
            String(db_packet.objHash)
        );

        if (!isValid_sign) {
            throw new Error("Signature verification failed");
        }
        arr_packet[index] = db_packet   
    }

    return arr_packet


    

}