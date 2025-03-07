import { generatePasetoForTesting, verifyPasetoForTesting } from "~/server/token_validator/paseto";


export default defineEventHandler(async (event)=>{
    try {
        const test = await generatePasetoForTesting()
        const isValid = await verifyPasetoForTesting(test)
        return{
            sussess: true,
            test : test,
            isValid : isValid
        }
    } catch (error) {
        console.log(error)
        return error
    }
}
)