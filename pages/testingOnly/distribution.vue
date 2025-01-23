<template>


</template>


<script setup lang="ts">


import AES from 'aes-js';
import { ec } from 'elliptic';
import secrets from 'secrets.js-grempe';

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
     * **非對稱加密 (ECC)**
     */
    class AsymmetricEncryption implements Encryption {
        private privateKey: ec.KeyPair;
        private publicKey: ec.KeyPair;

        constructor() {
            this.privateKey = EC.genKeyPair();
            this.publicKey = this.privateKey;
        }

        getPublicKey(): string {
            return this.publicKey.getPublic('hex');
        }

        getPrivateKey(): string {
            return this.privateKey.getPrivate('hex');
        }

        encrypt(message: string, receiverPublicKeyHex: string): string {
            if (!receiverPublicKeyHex) {
                throw new Error("Receiver's public key is required for ECC encryption.");
            }
            const receiverPublicKey = EC.keyFromPublic(receiverPublicKeyHex, 'hex');
            const sharedKey = receiverPublicKey
                .getPublic()
                .mul(this.privateKey.getPrivate())
                .encode('hex', false);
            const aesKey = AES.utils.hex.toBytes(sharedKey.substring(0, 32));
            const symmetricEncryption = new SymmetricEncryption(aesKey);
            return symmetricEncryption.encrypt(message);
        }

        decrypt(encryptedMessage: string, senderPublicKeyHex: string): string {
            if (!senderPublicKeyHex) {
                throw new Error("Sender's public key is required for ECC decryption.");
            }
            const senderPublicKey = EC.keyFromPublic(senderPublicKeyHex, 'hex');
            const sharedKey = senderPublicKey
                .getPublic()
                .mul(this.privateKey.getPrivate())
                .encode('hex', false);
            const aesKey = AES.utils.hex.toBytes(sharedKey.substring(0, 32));
            const symmetricEncryption = new SymmetricEncryption(aesKey);
            return symmetricEncryption.decrypt(encryptedMessage);
        }
    }

    /**
     * **秘密共享接口**
     */
    interface SecretSharing {
        split(secret: string, numShares: number, threshold: number): string[];
        combine(shares: string[]): string;
    }

    /**
     * **秘密共享 (Shamir Secret Sharing)**
     */
    class ShamirSecretSharing implements SecretSharing {
        split(secret: string, numShares: number, threshold: number): string[] {
            const hexSecret = secrets.str2hex(secret); // 將字串轉為 hex 格式
            return secrets.share(hexSecret, numShares, threshold); // 分割秘密
        }

        combine(shares: string[]): string {
            const hexSecret = secrets.combine(shares); // 還原秘密
            return secrets.hex2str(hexSecret); // 將 hex 格式轉回字串
        }
    }

    /**
     * **測試主程式**
     */
    async function main() {
        const message = "這是一段重要的訊息";

        // 1. 對稱加密
        const symmetricKey = AES.utils.hex.toBytes('1234567890abcdef1234567890abcdef'); // 32 字節密鑰
        const symmetricEncryption = new SymmetricEncryption(symmetricKey);

        console.log("原始訊息:", message);

        const encryptedSymmetric = symmetricEncryption.encrypt(message);
        console.log("AES 加密後的密文:", encryptedSymmetric);

        const decryptedSymmetric = symmetricEncryption.decrypt(encryptedSymmetric);
        console.log("AES 解密後的訊息:", decryptedSymmetric);

        // 2. 非對稱加密
        const senderEncryption = new AsymmetricEncryption();
        const receiverEncryption = new AsymmetricEncryption();

        console.log("發送者公鑰:", senderEncryption.getPublicKey());
        console.log("接收者公鑰:", receiverEncryption.getPublicKey());

        const encryptedECC = senderEncryption.encrypt(message, receiverEncryption.getPublicKey());
        console.log("ECC 加密後的密文:", encryptedECC);

        const decryptedECC = receiverEncryption.decrypt(encryptedECC, senderEncryption.getPublicKey());
        console.log("ECC 解密後的訊息:", decryptedECC);

        // 3. 分割與還原
        const secretSharing = new ShamirSecretSharing();
        const shares = secretSharing.split(encryptedSymmetric, 3, 2); // 分成 3 份，至少 2 份可還原
        console.log("分割後的訊息段:", shares);

        const restoredMessage = secretSharing.combine([shares[0], shares[1]]);
        console.log("還原後的密文:", restoredMessage);
    }
    main()
})


</script>