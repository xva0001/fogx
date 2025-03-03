import { z } from 'zod'


interface Ireceiver_req {
    jwt_token: string,
    p_token: string,
    targetUser: string,
    requestTime: string
}

export const Ireceiver_reqSchemaVaildatorRequestObj = z.object(
    {
        jwt_token: z.string(),
        p_token: z.string(),
        targetUser: z.string(),
        requestTime: z.string().datetime({ offset: true })
    }
)