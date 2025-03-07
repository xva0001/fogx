import EC from "elliptic";
export const keyGetterForJwt = () => {
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