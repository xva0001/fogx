<template>

    <p>key : {{ key }}</p>
    <p>otp : {{ totp }}</p>
    <p>interactive verification : {{ check }}</p>
    <img :src="imgdata">


</template>

<script setup lang="ts">
// reference for https://github.com/simontabor/2fa/blob/master/lib/2FA.js

import QRCode from 'qrcode';
import base32 from "hi-base32"
import type { IFactorCheckTool } from '~/composables/2FAObj';

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

const  $TOTPvalidator = SecFATool()

onMounted(() => {
    key.value = $TOTPvalidator.generateKey()
    totp.value = $TOTPvalidator.generateTOTP(key.value, Math.floor(Date.now() / 1000 / 30))
    check.value =$TOTPvalidator.validator(key.value, totp.value, Math.floor(Date.now() / 1000 / 30))
    setInterval(() => {
        totp.value = $TOTPvalidator.generateTOTP(key.value, Math.floor(Date.now() / 1000 / 30))
        check.value = $TOTPvalidator.validator(key.value, totp.value, Math.floor(Date.now() / 1000 / 30))
        genGoogleQr("xva","testing",key.value).then((res)=>{
            imgdata.value = res
        })
    }, 1000)

})
</script>