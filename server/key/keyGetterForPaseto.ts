import EC from "elliptic";
import { V4 } from "paseto";
export const keyGetterForPaseto=()=>{

    const ec = new EC.eddsa("ed25519")
    const keypair = ec.keyFromSecret(process.env.ED25519_SIGN_PRIVATE_KEY_PASETO!)   
    return {
        private: V4.bytesToKeyObject(Buffer.from(keypair.getSecret('hex'),'hex')),
        public: V4.bytesToKeyObject(Buffer.from(keypair.getPublic('hex'), 'hex'))
    }
}