import { generatePasetoForTesting, verifyPasetoForTesting } from "~/server/token_validator/paseto";


export default defineEventHandler(async (event)=>{
    try {
        const test = await generatePasetoForTesting()
        const isValid = await verifyPasetoForTesting(test)
        //const isValid_wrong = await verifyPasetoForTesting(test.replace("2","1"))
        //console.log(isValid);
        if(isValid){
        return{
            sussess: true,
            test : test,
            isValid : isValid
        }}else{
            return {
                sussess : false,
                isValid : false
            }    
        }
    } catch (error) {
        console.log(error)
        return {
            sussess : false,
            isValid : false
        }
    }
}
)