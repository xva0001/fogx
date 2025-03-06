import EC from "elliptic";
import { SignJWT, importJWK, jwtVerify } from "jose"
import { convertMsToJoseTime } from "~/shared/convertMssToSecond";


const appConfig = useAppConfig();
const keyGetter = () => {
    const ec = new EC.eddsa("ed25519");
    const keypair = ec.keyFromSecret(process.env.EDDSA_SIGN_PRIVATE_KEY!)
    const private_key = Buffer.from(keypair.getSecret('hex'), 'hex')
    const public_key = Buffer.from(keypair.getPublic('hex'), 'hex')
    const privJWK = {
        kty: "OKP",
        crv: "Ed25519",
        d: private_key.toString('base64url'),
        x: public_key.toString('base64url')
    }
    const pubJWK = {
        kty: 'OKP',
        crv: 'Ed25519',
        x: Buffer.from(public_key).toString('base64url'),
    }
    return { privJWK, pubJWK }
}

async function generateJWT(payload: any) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'EdDSA' })
        //opt
        .setIssuedAt()
        //.setIssuer(appConfig.domain)
        //.setAudience(targetdomain)
        //end opt
        .setExpirationTime(convertMsToJoseTime(appConfig.verification.tokenvaildTime))
        .sign(await importJWK(keyGetter().privJWK,"EdDSA"))
    return jwt
}



async function verifyJWT(token:string){
    const {payload , } = await jwtVerify(token,await importJWK(keyGetter().pubJWK,"EdDSA"))
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
    const jwt = await new SignJWT({test:"test"})
        .setProtectedHeader({ alg: 'EdDSA' })
        .setIssuedAt()
        .setExpirationTime(convertMsToJoseTime(appConfig.verification.tokenvaildTime))
        .sign(await importJWK(keyGetter().privJWK,"EdDSA"))
    //console.log("???");
    return jwt
}


async function verifyJWTForTesting(token:string){
    try {
        await verifyJWT(token)
        return true
    } catch (error) {
        return false
    }
}
export { generateJWT, verifyJWT, verifyJWTWithBoolean, generateJWTForTesting, verifyJWTForTesting }