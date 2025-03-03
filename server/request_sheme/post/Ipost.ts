import  {z} from 'zod'

interface Ipost {
    jwt_token: string,
    p_token: string,
    post: {
        title: string;
        content: string;
        images?: string[];
        tags?: string[];
        isLiked?: boolean;
        showComments: boolean;
    },
    requestTime: string
}
export const IpostSchemaVaildatorRequestObj = z.object(
    {
        jwt_token: z.string(),
        p_token: z.string(),
        post: z.object({
            title: z.string().min(4).max(40),
            content: z.string().min(4).max(1000),
            images: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            isLiked: z.boolean().optional(),
            showComments: z.boolean()
        }),
        requestTime: z.string().datetime({offset:true})
    }
)