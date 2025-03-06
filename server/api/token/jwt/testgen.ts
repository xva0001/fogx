
import { verifyJWTForTesting, generateJWTForTesting } from "~/server/token_validator/jwt"
import { defineEventHandler, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
    try {
        const test = await generateJWTForTesting()
        const isValid = await verifyJWTForTesting(test)
        return {
            success: true,
            test: test,
            isValid: isValid
        }
    } catch (e) {
        console.log(e);
        return {
            e
        }
    }
}
)