import {z} from "zod"
// 驗證請求體Schema
export const generalTokenSchema = z.object({
  jwt: z.string(),
  paseto: z.string()
})

export const generalPostStorySchema = z.object({
  jwt: z.string(),
  paseto: z.string(),
  postUUID : z.string().uuid(),
  password : z.string().length(64)

})