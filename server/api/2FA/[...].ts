import { invaildRequest } from "./responeError";
export default defineEventHandler((event)=>{
    throw invaildRequest
})