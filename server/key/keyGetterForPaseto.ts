import { V4 } from "paseto"
import { createPrivateKey,createPublicKey } from 'crypto'
export const keyGetterForPaseto=()=>{

    //const ec = new EC.eddsa("ed25519")
    //const keypair = ec.keyFromSecret(process.env.ED25519_SIGN_PRIVATE_KEY_PASETO!)   
    const keypair = {
        pri : createPrivateKey(process.env.ED25519_SIGN_PRIVATE_KEY_PASETO!),
        pub : createPublicKey(process.env.ED25519_SIGN_PUBLIC_KEY_PASETO!)
    }
    return {
        private: keypair.pri,
        public: keypair.pub
    }
}