import EC from "elliptic"


function genKeyCurve25519(){
    let keyPair = new EC.ec("curve25519").genKeyPair()
    return keyPair
}

function calSharedKey(pubkey:string,prikey:string){

    let keyPair = new EC.ec("curve25519").keyFromPrivate(prikey,"hex")
    let pub = new EC.ec("curve25519").keyFromPublic(pubkey,"hex")
    return keyPair.derive(pub.getPublic()).toString(16)

}
export {
    genKeyCurve25519,calSharedKey
}