<template>

    <p>key : {{ key }}</p>
    <p>otp : {{ totp }}</p>
    <p>interactive verification : {{ check }}</p>
    <img :src="imgdata">


</template>

<script setup lang="ts">
// reference for https://github.com/simontabor/2fa/blob/master/lib/2FA.js
import forge from "node-forge"
import QRCode from 'qrcode';
import base32 from "hi-base32"


interface GenerateKeyOptions {
    length?: number;
}

interface TOTPOptions {
    length?: number;
    drift?: number;
    beforeDrift?: number;
    afterDrift?: number;
}

const generateKey = ({ length = 64 }: GenerateKeyOptions = {}): string => {
    const padding = 3 - (length * 3 % 4);
    const requiredBytes = Math.ceil(length / 4) * 3 + padding;
    const bytes = forge.random.getBytesSync(requiredBytes);
    const key = forge.util.encode64(bytes).replace(/\+/g, '-').replace(/\//g, '_').slice(0, length);
    return key;
};


const generateTOTP = (key: string, counter: number, opts: TOTPOptions = {}): string => {
    const { length = 6 } = opts;

    // Convert counter to 8-byte array (Big-Endian)
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = counter & 0xff;
        counter = counter >> 8;
    }

    // Create HMAC object
    const hmac = forge.hmac.create();
    hmac.start('sha1', forge.util.createBuffer(key));
    hmac.update(forge.util.createBuffer(counterBytes).bytes());
    const hash = forge.util.bytesToHex(hmac.digest().getBytes());

    // Extract offset from hash's last byte
    const offset = parseInt(hash.slice(-1), 16) & 0x0f;

    // Extract 4 bytes starting from offset and compute binary value
    const binary = (parseInt(hash.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) >>> 0;

    // Convert binary value to a decimal string with the specified length
    const code = (binary % Math.pow(10, length)).toString().padStart(length, '0');

    return code;
};



// 驗證 HOTP 碼
const verifyHOTP = (key: string, code: string, counter: number, opts: TOTPOptions = {}): boolean => {
    const { drift = 0, beforeDrift = drift / 2, afterDrift = drift / 2 } = opts;

    // 允許的計數器範圍
    for (let i = counter - beforeDrift; i <= counter + afterDrift; i++) {
        if (generateTOTP(key, i, opts) === code) {
            return true; // 驗證成功
        }
    }
    return false; // 驗證失敗
}

const UrlFormmater = (name:string,acc:string,key:string)=>{
    return "otpauth://totp/"+ encodeURIComponent(acc)+"?issuer="+encodeURIComponent(name)+"&secret="+ base32.encode(key);   
}

const genGoogleQr = async  (name: string, acc: string, key: string, opt:QRCode.QRCodeToDataURLOptions = {}) => {

    const data = UrlFormmater(name,acc,key)
    return QRCode.toDataURL(data,opt);

}

const key = ref("")

const totp = ref("")

const check = ref()

const imgdata = ref<string>("")

onMounted(() => {
    key.value = generateKey()
    totp.value = generateTOTP(key.value, Math.floor(Date.now() / 1000 / 30))
    check.value =verifyHOTP(key.value, totp.value, Math.floor(Date.now() / 1000 / 30))
    setInterval(() => {
        totp.value = generateTOTP(key.value, Math.floor(Date.now() / 1000 / 30))
        check.value = verifyHOTP(key.value, totp.value, Math.floor(Date.now() / 1000 / 30))
        genGoogleQr("xva","testing",key.value).then((res)=>{
            imgdata.value = res
        })
    }, 1000)

})
</script>