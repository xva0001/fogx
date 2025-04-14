import { z } from 'zod'
interface Ipost {
    jwt: string,
    paseto: string,
    isPublic: boolean,
    iv?: string,
    title: string;
    content: string;
    Image?: string[];
    tags?: string[];
    requestTime: string
}
export const IpostSchemaVaildatorRequestObj = z.object(
    {
        jwt: z.string(),
        paseto: z.string(),
        isPublic: z.boolean(),
        iv: z.string().optional(),
        title: z.string().min(4).max(40),
        content: z.string().min(4).max(1000),
        Image: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        requestTime: z.string().datetime({offset:true})
    }
)

export const IPostDeleteRequest = z.object({
    jwt: z.string(),
    paseto: z.string(),
    postUUID: z.string()
})
