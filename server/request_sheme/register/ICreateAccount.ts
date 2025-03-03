import {z} from 'zod'

interface ICreateAccount {
    email: string
    hash384_password: string
    sha3_256_password: string
    username: string
    twoFAKey: string
    twoFAPassword: string
    requestTime: string
}

export const ICreateAccountSchemaVaildatorRequestObj = z.object(
    {
        email : z.string().email(),
        hash384_password : z.string().regex(/^[a-zA-Z0-9]{96}$/),
        sha3_256_password : z.string().regex(/^[a-zA-Z0-9]{64}$/),
        username : z.string().min(4).max(40),
        twoFAKey : z.string(),
        twoFAPassword : z.string(), 
        requestTime : z.string().datetime({offset:true})
    }
)