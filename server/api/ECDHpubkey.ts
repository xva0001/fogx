import { ecdhpubkey } from "../utils/publicKey"

export default defineEventHandler(()=>{
    return ecdhpubkey()
})