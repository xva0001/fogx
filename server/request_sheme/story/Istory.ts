import { z } from 'zod'

interface Istroy {
    jwt: string,
    paseto: string,
    image: string,
    requestTime: string
}

export const IstorySchemaVaildatorRequestObj = z.object(
    {
        jwt: z.string(),
        paseto: z.string(),
        image: z.string(),
        requestTime: z.string().datetime({ offset: true })
    })