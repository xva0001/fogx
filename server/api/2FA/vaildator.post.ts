import consola from "consola";
import { SecFATool } from "~/shared/2FATool";

import { z } from "zod"

const twofaSchema = z.object({
    name : z.string(),
    test : z.string().optional()
})


export default defineEventHandler(async (event)=>{
    
    

    const res = await readValidatedBody(event,body=>twofaSchema.safeParse(body))
    if (!res.success) {
        return event.$fetch("/api/2FA/responeError")
    }

    console.log(res)
    



    return res.data

})