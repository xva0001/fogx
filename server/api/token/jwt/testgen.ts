
import { verifyJWTForTesting, generateJWTForTesting } from "~/server/token_validator/jwt"
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
    try {
        const test = await generateJWTForTesting()
        const isValid = await verifyJWTForTesting(test)
        //const isValid_wrong = await verifyJWTForTesting(test.replace("e","2"))
        console.log(isValid);
        
        if (isValid) {
            return {
                success: true,
                test: test,
                isValid: isValid
            }
        }
        return {
            success: false,
            isValid: false
        }
    } catch (e) {
        console.log(e);
        return {
            success: false,
            isValid: false
        }
    }
}
)