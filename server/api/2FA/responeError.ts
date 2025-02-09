export const invaildRequest =  createError({
    statusCode : 400,
    statusMessage: "Request Invaild",
    stack : "",
    message: "an error created by developer",
    data:"no data",
    fatal : false

})

export default defineEventHandler((event)=>{
    return invaildRequest
})