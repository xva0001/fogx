<template>


</template>


<script setup lang="ts">


import AES from 'aes-js';
import { ec } from 'elliptic';
import { Secrets, secrets as secretsInstance } from 'easy-shamir-secret-sharing';

onMounted(() => {



    // ECC 初始化
    const EC = new ec('p256'); // 使用 P-256 橢圓曲線

    /**
     * **加密接口**
     */
    interface Encryption {
        encrypt(message: string, key?: string): string;
        decrypt(encryptedMessage: string, key?: string): string;
    }

    /**
     * **對稱加密 (AES)**
     */
    class SymmetricEncryption implements Encryption {
        private key: Uint8Array;

        constructor(key: Uint8Array) {
            this.key = key;
        }

        encrypt(message: string): string {
            const textBytes = AES.utils.utf8.toBytes(message);
            const aesCtr = new AES.ModeOfOperation.ctr(this.key);
            const encryptedBytes = aesCtr.encrypt(textBytes);
            return AES.utils.hex.fromBytes(encryptedBytes);
        }

        decrypt(encryptedMessage: string): string {
            const encryptedBytes = AES.utils.hex.toBytes(encryptedMessage);
            const aesCtr = new AES.ModeOfOperation.ctr(this.key);
            const decryptedBytes = aesCtr.decrypt(encryptedBytes);
            return AES.utils.utf8.fromBytes(decryptedBytes);
        }
    }



    /**
     * **測試主程式**
     */
    async function main() {


        // 1. 對稱加密
        // const symmetricKey = AES.utils.hex.toBytes('1234567890abcdef1234567890abcdef'); // 32 字節密鑰
        // const symmetricEncryption = new SymmetricEncryption(symmetricKey);

        // console.log("原始訊息:", message);

        // const encryptedSymmetric = symmetricEncryption.encrypt(message);
        // console.log("AES 加密後的密文:", encryptedSymmetric);

        // const decryptedSymmetric = symmetricEncryption.decrypt(encryptedSymmetric);
        // console.log("AES 解密後的訊息:", decryptedSymmetric);

        // // 2. 非對稱加密
        // const senderEncryption = new AsymmetricEncryption();
        // const receiverEncryption = new AsymmetricEncryption();

        // console.log("發送者公鑰:", senderEncryption.getPublicKey());
        // console.log("接收者公鑰:", receiverEncryption.getPublicKey());

        // const encryptedECC = senderEncryption.encrypt(message, receiverEncryption.getPublicKey());
        // console.log("ECC 加密後的密文:", encryptedECC);

        // const decryptedECC = receiverEncryption.decrypt(encryptedECC, senderEncryption.getPublicKey());
        // console.log("ECC 解密後的訊息:", decryptedECC);

        // 3. 分割與還原
        //style of class promg
        const message = "這是兩段重要的訊息";
        let secrets: any = new Secrets(message, 4, 3);
        await secrets.executeShares();
        console.log("分割後的訊息段:", secrets.getSharesResult());
        await secrets.executeCombine(secrets.getSharesResult());
        console.log("還原後的密文:", secrets.getCombinedResult());


        console.log("另一種風格");

        secrets = secretsInstance

        const arr = await secrets.share(message, 4, 3)
        console.log("分割後的訊息段:", arr);
        const combined = await secrets.combine(arr)
        console.log("還原後的密文:", combined);
    }
    main()
}
)


</script>