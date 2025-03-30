import {V4} from 'paseto'
import { keyGetterForPaseto } from '../key/keyGetterForPaseto'
import { convertMsToSecString } from '~/shared/convertMssToSecond';


//error here
/**
 * note :
 * openssl genpkey -algorithm ed25519 -out private_key.pem
*  openssl pkey -in private_key.pem -pubout -out public_key.pem
 */
const appConfig = useAppConfig();
const generatePaseto =async(paylaod:any,ms? : number)=>{
    const  token = await V4.sign(paylaod,keyGetterForPaseto().private,{
        expiresIn : convertMsToSecString(ms || appConfig.verification.tokenvaildTime),
        kid : 'paseto'
    })
    return token
}

const verifyToken = async (token:string)=>{
   return await V4.verify(token,keyGetterForPaseto().public)
}

const verifyTokenWithBoolean = async (token:string)=>{
    try {
        await verifyToken(token)
        return true
    } catch (error) {
        return false
    }
}


async function generatePasetoForTesting() {
    return await generatePaseto({test:"test"})    
}

async function verifyPasetoForTesting(token:string){
    return await verifyTokenWithBoolean(token)   
}

export {
    generatePaseto,
    verifyToken,
    verifyTokenWithBoolean,
    verifyPasetoForTesting,
    generatePasetoForTesting
}