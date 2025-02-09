//import EC from "elliptic"

export const pubkey = ()=>{
    let key =process.env.ECC_PUBLIC_KEY
    if(!key){
        return createError({
            statusCode : 500,
            stack:"",
            message:"No key here"
        }).toJSON()                             //if you have redis or other stroge to save dynamic key pair, please change this part
    }
    return {"publicKey":key,"len" : key.length }

}
