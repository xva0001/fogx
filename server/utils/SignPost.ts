import pkg from "js-sha3"
import { IPost } from "../db_data_schema/PostSchema"
import { ShaimirStringSplitTool } from "./imageDistrubutionTool"
import SignMessage from "~/shared/Request/signMessage"




const { sha3_256 } = pkg


export async function createSignedPostPacket(
    uuid: string,
    userUUID: string,
    createdDate: Date,
    isPublic: boolean,
    iv: string,
    title: string,
    content: string,
    ImageBase64: string[],
    tags: string[],
    shareNum: number,
    threshold: number
) {


    const arr_packet: IPost[] = new Array(shareNum)

    //image arr
    const stringifyForImgArr = JSON.stringify(ImageBase64)
    const sha3_384ForstringifyForImgArr = sha3_256(stringifyForImgArr)

    const imageShares = await ShaimirStringSplitTool.splitAndShare(stringifyForImgArr, shareNum, threshold)

    const q = await ShaimirStringSplitTool.combineShares(imageShares)

    if (sha3_256(q) != sha3_384ForstringifyForImgArr) {
        throw new Error("ShamirImageTool : hash result inconsistant")
    }

    let reverseImg = groupByIndex_V2(imageShares).groups
    //stop image arr


    const loopOfAttribute = [content, title]
    let arr_loopOfAttributeRRes: Record<string, (string[][] | null)> = { content: null, title: null }
    const arrKey = Object.keys(arr_loopOfAttributeRRes)
    for (let index = 0; index < loopOfAttribute.length; index++) {
        const param = loopOfAttribute[index];
        const sha3Res = sha3_256(param)
        const resShares = await ShaimirStringSplitTool.splitAndShare(param, shareNum, threshold)
        const q_verify = await ShaimirStringSplitTool.combineShares(resShares)
        if (sha3_256(q_verify) != sha3Res) {
            throw new Error("ShamirImageTool : hash result inconsistant in loop attribute")
        }
        const reverseAns = groupByIndex_V2(resShares).groups
        arr_loopOfAttributeRRes[arrKey[index]] = (reverseAns)
    }

    if (arr_loopOfAttributeRRes.title == null || arr_loopOfAttributeRRes.content == null) {
        throw new Error("Unrunable, unRearch code")
    }

    for (let index = 0; index < shareNum; index++) {
        const db_packet: IPost = {
            UUID: uuid,
            UserUUID: userUUID,
            createdDate: createdDate,
            isPublic: isPublic,
            iv: iv,
            title: arr_loopOfAttributeRRes.title[index],
            content: arr_loopOfAttributeRRes.content[index],
            Image: reverseImg[index],
            tags: tags,
            objHash: "",
            objSign: ""
        }
        let string_packet = JSON.stringify(db_packet)
        let str_hash = sha3_256_postHash(db_packet)
        db_packet.objHash = str_hash
        try {
            let signObj = await SignMessage.sign(
                process.env.EDDSA_SIGN_PRIVATE_KEY!,
                string_packet           //include sha3_256
            )

            if (signObj.hash != db_packet.objHash) {
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