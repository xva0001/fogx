import { z } from 'zod'

interface Istroy {
    jwt_token: string,
    p_token: string,
    story: string,
    requestTime: string
}

export const IstorySchemaVaildatorRequestObj = z.object(
    {
        jwt_token: z.string(),
        p_token: z.string(),
        story: z.string(),
        requestTime: z.string().datetime({ offset: true })
    })