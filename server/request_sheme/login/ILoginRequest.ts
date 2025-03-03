import {z} from 'zod'

interface ILoginRequest {
    email: string,
    hash384_password: string,
    hash3_256_password: string,
    username : string,
    twoFAPassword: string,
    requestTime: string
}

export const ILoginRequestSchemaVaildatorRequestObj = z.object(
    {
        email : z.string().email(),
        hash384_password : z.string().regex(/^[a-zA-Z0-9]{96}$/),
        hash3_256_password : z.string().regex(/^[a-zA-Z0-9]{64}$/),
        username : z.string().min(4).max(40),
        twoFAPassword : z.string(),
        requestTime : z.string().datetime({offset:true})
    }
)