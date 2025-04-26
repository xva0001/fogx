import consola from "consola";
import { getCorrectPost } from "~/server/DataFixer/PostFixer";
import { IPost } from "~/server/db_data_schema/PostSchema";
import { findPostByUserUUID } from "~/server/dbOperation/findPostByUserUUID";
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler";
import { generalTokenSchema } from "~/server/request_sheme/general/generalTokenSchema";
import { verifyJWT } from "~/server/token_validator/jwt";
import { verifyToken } from "~/server/token_validator/paseto";
import RequestEncryption from "~/shared/Request/requestEncrytion";


interface IPost_resp {
    id: string
    icon: string
    username: string
    userID: string
    isPublic: boolean
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
const logger =  consola.withTag("userPostGetProfile")

export default defineEventHandler(async (event) => {


    let shared
    let decrypted
    const body = await readBody(event)


    try {
        decrypted = await IncomingReqEncryptionHandler(event, generalTokenSchema);


        shared = GetSharedKeyHandler(body)
    } catch (error) {
        throw createError(`Error in request processing: ${error}`)
    }

    let jwtPayload
    let pasetoPayload
    let userUUID: string
    try {
        jwtPayload = await verifyJWT(decrypted.jwt)
        pasetoPayload = await verifyToken(decrypted.paseto)

        if (!jwtPayload || jwtPayload.login !== "completed") {
            throw new Error("Invalid or expired JWT")
        }
        if (!pasetoPayload || pasetoPayload.login !== "completed") {
            throw new Error("Invalid or expired Paseto token")
        }

        userUUID = jwtPayload.CUUID as string
    } catch (error) {
        throw createError("Token verification failed")
    }

    const dbConnector = new MongoDBConnector()

    const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
    await dbConnector.dbConnsOpen(dbNames);


    try {
        const postsData = (await findPostByUserUUID(dbConnector, userUUID)).postGroups
        
        logger.info(postsData.length)

        let posts: IPost[] = []; // 存儲修正後的 Post

        for (const post of postsData) {

            let problemArr: number[] = [];

            const validPostsInGroup = post.map((p, i) => {
                if (p === undefined) {
                    problemArr.push(i)
                }
            })
            if (problemArr.length < getThreshold()) {
                posts.push(await getCorrectPost(post, problemArr))
            } else {
                logger.info(`Post Group for UUID ${post[0]?.UUID} did not meet threshold after filtering invalid entries.`)
            }
        }

        function convertIPostToIPostResp(post: IPost): IPost_resp {
            return {
                id: post.UUID,
                userID: post.UserUUID,
                isPublic: post.isPublic,
                date: post.createdDate,
                title: post.title[0], // Assuming first title is the main one
                content: post.content[0], // Assuming first content is the main one
                images: post.Image,
                tags: post.tags,
                // Default values for fields not in IPost
                icon: '',
                username: '',
                likes: 0,
                commentCount: 0,
                isLiked: false,
                showComments: false,
                newComment: '',
                comments: []
            };
        }

        const respPosts = posts.map(convertIPostToIPostResp);

        logger.info(respPosts.length)

        return await RequestEncryption.encryptMessage(JSON.stringify(respPosts),shared);
    }
    catch (e) {

    } finally {
        await dbConnector.dbConnsClose()
    }

})
