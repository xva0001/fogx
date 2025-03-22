import {z} from 'zod'

interface ILoginRequest {
    email: string,
    hash384_password: string,
    hash3_256_password: string,
    username : string,
    twoFAPassword: string,
    requestTime: string
}

export const ILoginRequestSchemaVaildatorRequestObj = z.object({
    email: z.string().email().optional(),
    hash384_password: z.string().regex(/^[a-zA-Z0-9]{96}$/),
    hash3_256_password: z.string().regex(/^[a-zA-Z0-9]{64}$/),
    username: z.string().min(4).max(40).optional(),
    twoFAPassword: z.string(),
    requestTime: z.string().datetime({ offset: true }),
}).refine(
    (data) =>
        (data.email && !data.username) || (!data.email && data.username),
    {
        message: "Provide either email or username, not both or neither",
        path: ['email'], // 可選擇放在 ['username'] 視你要 error 出現在哪
    }
)
export const ILoginRequestSchemaVaildatorRequestObj_without_otp = z.object({
    email: z.string().email().optional(),
    hash384_password: z.string().regex(/^[a-zA-Z0-9]{96}$/),
    hash3_256_password: z.string().regex(/^[a-zA-Z0-9]{64}$/),
    username: z.string().min(4).max(40).optional(),
    //twoFAPassword: z.string(),
    requestTime: z.string().datetime({ offset: true }),
}).refine(
    (data) =>
        (data.email && !data.username) || (!data.email && data.username),
    {
        message: "Provide either email or username, not both or neither",
        path: ['email'], // 可選擇放在 ['username'] 視你要 error 出現在哪
    }
)
