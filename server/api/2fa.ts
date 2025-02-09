export default defineEventHandler((event)=>{
    return event.$fetch("/api/2FA/responeError")
})