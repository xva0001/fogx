// import * as ed from '@noble/ed25519';

// export default defineEventHandler( async () => {
//     // 生成 Ed25519 私钥（32 字节）
//     const privateKey = ed.utils.randomPrivateKey();
//     // 计算对应的公钥（32 字节）
//     const publicKey = await ed.getPublicKeyAsync(privateKey);

//     return {
//         private_key: Buffer.from(privateKey).toString("hex"),
//         public_key: Buffer.from(publicKey).toString("hex")
//     };
// });
import { generateKeyPairSync, createPrivateKey, createPublicKey } from 'crypto';

export default defineEventHandler(() => {
    // 生成 Ed25519 密钥对
    const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
        privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
        publicKeyEncoding: { format: 'pem', type: 'spki' }
    });

    // 创建 PrivateKey 和 PublicKey 对象
    const privateKeyObj = createPrivateKey(privateKey);
    const publicKeyObj = createPublicKey(publicKey);

    return {
        private_key: privateKey.toString(), // PEM 格式私钥
        public_key: publicKey.toString()    // PEM 格式公钥
    };
});
