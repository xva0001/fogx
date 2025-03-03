import {z} from 'zod'

interface ICheckName {
    username: string
    requestTime: string
}

export const ICheckNameSchemaVaildatorRequestObj = z.object(
    {
        username : z.string().min(4).max(40),
        requestTime : z.string().datetime({offset:true})
    }
)