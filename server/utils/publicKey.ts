import EC from "elliptic"
import pkg from "js-sha3"

const {sha3_256, sha3_384} = pkg

const noKeyErr = 
createError({
    statusCode : 500,
    stack:"",
    message:"No key here"
}).toJSON()                             //if you have redis or other stroge to save dynamic key pair, please change this part


const getKey = (key:string|null|undefined)=>{

    if(!key){
        return noKeyErr
    }
    return {"pubkey":key , "len" : key.length}
}

export const ecdhpubkey = ()=>{
    let key =process.env.ECC_PUBLIC_KEY
    let publicKeyObject :{ pubkey: string, len: number, sign?: any, orgMsgHash?:any } = getKey(key) as { pubkey: string, len: number }


    let sign_pair = new EC.ec("ed25519").keyFromPrivate(process.env.ECDSA_SIGN_PRIVATE_KEY!,"hex")
    let org = JSON.stringify(publicKeyObject)
    let hashMsg  = sha3_256(org)
    publicKeyObject["sign"] = sign_pair.sign(hashMsg).toDER("hex")
    publicKeyObject["orgMsgHash"] = sha3_256(org)
    return publicKeyObject


}

export const ec_sign_key = ()=>{
    let key = process.env.ECDSA_SIGN_PUBLIC_KEY
    return getKey(key)

}