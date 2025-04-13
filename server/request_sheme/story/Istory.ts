import { z } from 'zod'

interface Istroy {
    jwt: string,
    paseto: string,
    image: string,
    isPublic: boolean
    iv: string
    requestTime: string
}

export const IstorySchemaVaildatorRequestObj = z.object(
    {
        jwt: z.string(),
        paseto: z.string(),
        image: z.string(),
        isPublic: z.boolean(),
        iv: z.string().optional(),
        requestTime: z.string().datetime({ offset: true })
    })
export const IStoryDeleteRequest = z.object({

    jwt: z.string(),
    paseto: z.string(),
    storyUUID: z.string()
})