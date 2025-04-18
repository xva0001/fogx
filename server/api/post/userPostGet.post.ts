import { getCorrectPost } from "~/server/DataFixer/PostFixer"
import { findPublicPost } from "~/server/dbOperation/findPublicPost"
import { getUserInfo } from "~/server/dbOperation/getUserInfo"
import { GetSharedKeyHandler, IncomingReqEncryptionHandler } from "~/server/eventHandle/EncrytionHandler/IncomingEncryptionHandler"
import { generalTokenSchema } from "~/server/request_sheme/general/generalTokenSchema"
import { verifyJWT } from "~/server/token_validator/jwt"
import { verifyToken } from "~/server/token_validator/paseto"
import RequestEncryption from "~/shared/Request/requestEncrytion"

import { H3Event, defineEventHandler, readBody, createError } from "h3";
import { EncryptReq, EncryptReqShema } from "~/shared/Request/IEncryptReq";
import { EncryptedRes } from "~/shared/Request/IEncryptRes";
import InvalidError from "~/server/err/InvalidErr";
import { calSharedKey } from "~/shared/useKeyFn";
import { MongoDBConnector } from "~/server/utils/mongodbConn";
import { userSchema, IUser } from "~/server/db_data_schema/UserSchema";
import { IPost } from "~/server/db_data_schema/PostSchema";
import { Icomment, Comment} from "~/server/db_data_schema/IComment";
import { getThreshold } from "~/server/utils/getShareSettings";
import { z } from "zod";
import Identicon from 'identicon.js';
import pkg from 'js-sha3';
const { sha3_256, sha3_384 } = pkg;
import mongoose from 'mongoose';
import { ILike, Like } from "~/server/db_data_schema/ILike";


interface ICommentResponse {
    id: string;
    userID: string;
    username: string;
    icon: string;
    date: Date | string;
    content: string; // 返回未加密的內容
}

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

// 修改 Zod Schema 以包含可選的 page 和 limit 參數
const UserPostGetSchema = z.object({
    jwt: z.string(),
    paseto: z.string(),
    page: z.number().int().positive().optional().default(1), // 添加 page 參數
    limit: z.number().int().positive().optional().default(10) // 添加 limit 參數
  });
  type TUserPostGetRequest = z.infer<typeof UserPostGetSchema>;
  
  
  export default defineEventHandler(async (event: H3Event): Promise<EncryptedRes | ReturnType<typeof createError>> => {
      const body = await readBody(event);
      const req = EncryptReqShema.safeParse(body); // 驗證外層加密結構
      const dbConnector: MongoDBConnector = new MongoDBConnector();
  
      if (!req.success) {
          console.error("Invalid request body structure (outer encryption layer):", req.error);
          return createError({ statusCode: 400, statusMessage: "Bad Request", message: "Invalid request structure." });
      }
  
      let shared: string | undefined;
      let decryptedData: TUserPostGetRequest | undefined;
  
      try {
          // 解密請求
          shared = calSharedKey(req.data.pubkey, process.env.ECC_PRIVATE_KEY!);
          if (!shared) throw new Error("Failed to calculate shared key.");
  
          const decrypt = await RequestEncryption.decryptMessage(req.data.encryptedMessage, shared, req.data.iv);
          const parsedDecrypt = UserPostGetSchema.safeParse(JSON.parse(decrypt)); // 驗證解密後的內容
          if (!parsedDecrypt.success) {
              console.error("Invalid decrypted data structure (inner payload):", parsedDecrypt.error);
              throw new Error("Invalid decrypted data format.");
          }
          decryptedData = parsedDecrypt.data;
  
          // 驗證 Token
          const jwtPayload = await verifyJWT(decryptedData.jwt);
          const pasetoPayload = await verifyToken(decryptedData.paseto);
          if (!jwtPayload || jwtPayload.login !== "completed") { // 假設獲取帖子需要 'completed' 狀態
              throw new Error("Invalid or expired JWT.");
          }
          if (!pasetoPayload || pasetoPayload.login !== "completed") {
              throw new Error("Invalid or expired Paseto token.");
          }
          const userUUID: string = jwtPayload.CUUID as string; // 獲取請求用戶的 CUUID
  
          // 連接數據庫
          const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
          await dbConnector.dbConnsOpen(dbNames);
          const connections = dbConnector.getDbConnections();

          try {
              // 調用修改後的 findPublicPost，傳遞 page 和 limit
              const { postGroups, hasMorePages } = await findPublicPost(
                  dbConnector,
                  decryptedData.page,
                  decryptedData.limit
              );
  
              let posts: IPost[] = []; // 存儲修正後的 Post
              for (const group of postGroups) {
                  let problemArr: number[] = [];
                  const validPostsInGroup = group.filter((p, index) => {
                      if (p === undefined) problemArr.push(index);
                      return p !== undefined;
                  });
                   if (validPostsInGroup.length >= getThreshold()) {
                      posts.push(await getCorrectPost(validPostsInGroup, problemArr));
                   } else {
                      console.warn(`Post group for UUID ${group[0]?.UUID} did not meet threshold after filtering invalid entries.`);
                   }
              }
  
              let arr_post_resp: IPost_resp[] = []; // 存儲最終返回給前端的 Post 列表
              const primaryConn = connections[0];

              const LikeModel = primaryConn.model<ILike>('Like', Like.schema);
              const CommentModel = primaryConn.model<Icomment>('Comment', Comment.schema);
              const UserModel = primaryConn.model<IUser>('user', userSchema)

              for (let index = 0; index < posts.length; index++) {
                  const item = posts[index];
                  try {
                      // 獲取發布者信息
                      const postUser = await getUserInfo(dbConnector, item.UserUUID);
                      if (postUser == null) {
                          console.warn(`User info not found for UserUUID: ${item.UserUUID}, skipping post ${item.UUID}`);
                          continue; // 跳過無法獲取用戶信息的帖子
                      }

                        const likesForPost = await LikeModel.find({ PostUUID: item.UUID }).lean();
                        const isLiked = likesForPost.some(like => like.UserUUID === userUUID);
                        const likesCount = likesForPost.length;
    
                        // 查詢該帖子的所有評論
                        const commentsForPost = await CommentModel.find({ 
                            PostUUID: item.UUID,
                            isPublic: true 
                        }).sort({ createdDate: -1 }).lean();
                        //const commentsFromDb = (item.comments as Icomment[]) ?? [];

                        // 轉換評論數據
                        const commentsForFrontend: ICommentResponse[] = await Promise.all(commentsForPost.map(async dbComment => {
                            // 為每個評論者獲取信息 (如果需要 icon/username 且 CommentSchema 沒存)
                            // 注意：如果評論多，這裡會有很多數據庫查詢，考慮優化
                            let commenterInfo: Pick<IUser, 'username' | 'icon' | 'CUUID'> | null = null;
                            try {
                                if (connections.length > 0) {
                                    const userModel = connections[0].model<IUser>("user", userSchema);
                                    commenterInfo = await userModel.findOne({ CUUID: dbComment.UserUUID }).select('username icon CUUID').lean();
                               } else {
                                   console.error("No database connection available to fetch commenter info.");
                               }
                            } catch (e) { console.error(`Failed to fetch info for commenter ${dbComment.UserUUID}`, e); }

                            let commentIdString: string;
                            if (dbComment._id) {
                                // 如果 _id 已經是 string (很可能因為 .lean())
                                if (typeof dbComment._id === 'string') {
                                    commentIdString = dbComment._id;
                                }
                                // 如果它仍然是 ObjectId 對象
                                else if (typeof dbComment._id === 'object' && dbComment._id !== null && typeof (dbComment._id as any).toHexString === 'function') {
                                    commentIdString = (dbComment._id as mongoose.Types.ObjectId).toHexString();
                                }
                                // Fallback
                                else {
                                    console.warn("Unexpected type for dbComment._id:", typeof dbComment._id, dbComment._id);
                                    commentIdString = `err-${Date.now()}-${Math.random()}`;
                                }
                            } else {
                                console.warn("dbComment._id is missing:", dbComment);
                                commentIdString = `missing-${Date.now()}-${Math.random()}`;
                            }                            

                            return {
                                id: commentIdString, // 使用真實 _id
                                userID: dbComment.UserUUID,
                                username: commenterInfo?.username || 'Unknown',
                                icon: commenterInfo?.icon // <--- 從 commenterInfo 獲取 icon
                                    ? (commenterInfo.icon.startsWith('data:image') ? commenterInfo.icon : "data:image/png;base64," + commenterInfo.icon)
                                    : "data:image/png;base64," + new Identicon(sha3_256(commenterInfo?.username || dbComment.UserUUID), 100).toString(),
                                date: dbComment.createdDate,
                                content: dbComment.content // <--- 注意：這裡返回的是加密內容！需要解密
                                // 如果後端解密: content: await RequestEncryption.decryptCommentContent(dbComment.content, dbComment.iv, sharedKeyForComment)
                            };
                        }));                      

                        const newItem: IPost_resp = {
                            id: item.UUID,
                            icon: postUser.icon
                                ? (postUser.icon.startsWith('data:image') ? postUser.icon : "data:image/png;base64," + postUser.icon)
                                : "data:image/png;base64," + new Identicon(sha3_256(postUser.username || postUser.CUUID), 100).toString(),
                            username: postUser.username || `Unknown User (${item.UserUUID.substring(0, 6)})`,
                            userID: postUser.CUUID,
                            date: item.createdDate,
                            title: item.title?.[0] || "Untitled",
                            content: item.content?.[0] || "",
                            images: item.Image || [],
                            tags: item.tags || [],
                            likes: likesCount,
                            commentCount: commentsForPost.length,
                            isLiked: isLiked,
                            showComments: false,
                            newComment: '',
                            comments: commentsForFrontend
                        };

                        //newItem.comments = commentsForFrontend;
                        // 轉換數據結構為 IPost_resp

                        arr_post_resp.push(newItem);
                  } catch (userInfoError) {
                      console.error(`Error processing post ${item.UUID} due to user info error:`, userInfoError);
                      // 可以選擇跳過這個帖子或返回部分數據
                  }
              }
  
              // 準備加密的回應 payload
              const responsePayload = {
                  success: true,
                  posts: arr_post_resp,
                  hasMorePages: hasMorePages
              };
  
              // 加密回應
              let encryptedResponse = await RequestEncryption.encryptMessage(JSON.stringify(responsePayload), shared);
              return {
                  success: true, // API 本身成功
                  iv: encryptedResponse.iv,
                  encryptedMessage: encryptedResponse.encryptedMessage
              };
  
          } finally {
              await dbConnector.dbConnsClose(); // 確保數據庫連接關閉
          }
  
      } catch (error: any) {
          console.error("!!! Error in userPostGet API:", error);
          // 加密錯誤回應
          if (shared) {
              try {
                  const errorPayload = { success: false, message: error.message || "An unexpected error occurred." };
                  const encryptedError = await RequestEncryption.encryptMessage(JSON.stringify(errorPayload), shared);
                  // 返回加密後的錯誤
                  return { success: true, iv: encryptedError.iv, encryptedMessage: encryptedError.encryptedMessage };
              } catch (encryptionError) {
                  console.error("Failed to encrypt error response:", encryptionError);
                  return createError({ statusCode: 500, statusMessage: "Server Error", data: "Failed to process request and encrypt error." });
              }
          } else {
              return createError({ statusCode: 500, statusMessage: "Server Error", data: error.message || "Failed to process request." });
          }
      }
  });