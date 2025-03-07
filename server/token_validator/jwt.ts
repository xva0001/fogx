import { SignJWT, importJWK, jwtVerify } from "jose"
import { convertMsToSecString } from "~/shared/convertMssToSecond";
import { keyGetterForJwt } from "../key/keyGetterForJwt";

const appConfig = useAppConfig();


async function generateJWT(payload: any) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'EdDSA' })
        //opt
        .setIssuedAt()
        //.setIssuer(appConfig.domain)
        //.setAudience(targetdomain)
        //end opt
        .setExpirationTime(convertMsToSecString(appConfig.verification.tokenvaildTime))
        .sign(await importJWK(keyGetterForJwt().privJWK,"EdDSA"))
    return jwt
}



async function verifyJWT(token:string){
    const {payload , } = await jwtVerify(token,await importJWK(keyGetterForJwt().pubJWK,"EdDSA"))
    return payload
}

async function verifyJWTWithBoolean(token:string){
    try {
        await verifyJWT(token)
        return true
    } catch (error) {
        return false
    }
}


async function generateJWTForTesting() {
    return await generateJWT({test:"test"})
}


async function verifyJWTForTesting(token:string){
    return await verifyJWTWithBoolean(token)
}
export { generateJWT, verifyJWT, verifyJWTWithBoolean, generateJWTForTesting, verifyJWTForTesting }
