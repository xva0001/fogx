import EC from "elliptic"

export default defineEventHandler(()=>{
    const ec = new EC.ec('ed25519')
    const kp = ec.genKeyPair()
    const pri = Buffer.from(kp.getPrivate("hex"),'hex')
    const pub = Buffer.from(kp.getPublic("hex"),'hex')
    return{
        private_key: pri.toString("hex"),
        public_key : pub.toString('hex')
    }
})