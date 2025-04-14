import { getCorrectPost } from "~/server/DataFixer/PostFixer"
import { findPublicPost } from "~/server/dbOperation/findPublicPost"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalTokenSchema } from "~/server/request_sheme/general/generalTokenSchema"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"

interface IPost_resp {
    id: string
    icon: string
    username: string
    userID: string
    date: Date
    title: string
    content: string
    images: string[]
    tags: string[]
    likes: number
    commentCount: number
    isLiked: boolean
    showComments: boolean
    newComment: string
    comments: any[]
}

export default defineEventHandler(async (event) => {
    let shared
    let decrypted

    const body = await readBody(event)

    try {
        decrypted = await IncomingReqEncryptionHandler(event, generalTokenSchema)
        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError("err on (decrypt)" + error)
    }

    let jwtPayload
    let pasetoPayload
    let userUUID: string
    try {
        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired initial JWT.")
        }
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired initial Paseto token.")
        }

        userUUID = jwtPayload.CUUID as string
    } catch (error) {
        throw createError("TOKEN ERROR!")
    }

    const dbConnector = new MongoDBConnector()
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr
    try {
        await dbConnector.dbConnsOpen(dbNames)
        let res = await findPublicPost(dbConnector)
        let posts = []

        for (let index = 0; index < res.length; index++) {
            const element = res[index]
            let problemArr = []
            for (let index = 0; index < element.length; index++) {
                const sharePart = element[index]
                if (sharePart === undefined) {
                    problemArr.push(index)
                }
            }
            posts.push(await getCorrectPost(element, problemArr))
        }

        let arr_post_resp: IPost_resp[] = []
        let problemInt: number[] = []
        
        for (let index = 0; index < posts.length; index++) {
            const item = posts[index]
            const user = await getUserInfo(dbConnector, item.UserUUID)
            if (user == null) {
                problemInt.push(index)
                continue
            }

            const newItem: IPost_resp = {
                id: item.UUID,
                icon: '📝',
                username: user.username || `User_${index}`,
                userID: user.CUUID || `user_${index}`,
                date: item.createdDate || new Date(),
                title: item.title[0] || `Post ${index}`,
                content: item.content[0] || `This is post content for ${index}`,
                images: item.Image || [],
                tags: item.tags || ['tag1', 'tag2'],
                likes: 0,
                commentCount: 0,
                isLiked: false,
                showComments: false,
                newComment: '',
                comments: []
            }
            arr_post_resp.push(newItem)
        }

        let response = await RequestEncryption.encryptMessage(JSON.stringify(arr_post_resp), shared)
        return response

    } catch (error) {
        console.log(error)
        return {
            success: false,
        }
    } finally {
        await dbConnector.dbConnsClose()
    }
})