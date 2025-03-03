import { z } from 'zod'


interface Isender_req {
    jwt_token: string,
    p_token: string,
    encryptedMessage: {
        iv: string,
        content: string,
        signature: string
    },
    targetUser : string,
    requestTime: string
}

export const Isender_reqSchemaVaildatorRequestObj = z.object(
    {
        jwt_token: z.string(),
        p_token: z.string(),
        encryptedMessage: z.object({
            iv: z.string(),
            content: z.string().min(1),
            signature: z.string().length(128)
        }),
        targetUser : z.string(),
        requestTime: z.string().datetime({offset:true})
    }
)