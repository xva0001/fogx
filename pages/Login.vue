<template>
    <div
        :class="`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`">

        <div :class="`shadow-lg rounded-lg p-8 w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`">


            <div class="flex justify-between mb-4">
                <button @click="goBack" class="px-3 py-1 rounded-lg border text-md flex items-center"
                    :class="isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'">
                    <Icon name="material-symbols:arrow-left-alt" class="w-5 h-5 mr-2" />
                    Back
                </button>
            </div>



            <!-- Logo & Title -->
            <div class="flex flex-col items-center mb-6">
                <NuxtImg :src="isDark ? dark_logo : logo" alt="Logo" class="w-24 h-24 mb-2"
                    :class="isDark ? 'text-white' : 'text-black'">
                </NuxtImg>
                <h1 class="text-2xl font-bold">Welcome Back!</h1>
                <p class="text-sm">{{ isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled' }}</p>
            </div>

            <!-- Theme Toggle -->
            <div class="flex justify-end mb-4">
                <DarkModeBtn />
            </div>

            <!-- Form Fields -->
            <form @submit.prevent="handleLogin" class="space-y-4">
                <!-- Username -->
                <div>
                    <label for="username" class="block mb-1">Username</label>
                    <input v-model="username" id="username" type="text" placeholder="Enter your username"
                        class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                        required />
                </div>

                <!-- Password -->
                <div>
                    <label for="password" class="block mb-1">Password</label>
                    <input v-model="password" id="password" type="password" placeholder="Enter your password"
                        class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                        required />
                </div>

                <NuxtTurnstile ref="turnstile" />

                <!-- Login Button -->
                <button type="submit" class="w-full py-2 rounded-lg text-white focus:outline-none"
                    :class="isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'">
                    Login
                </button>
            </form>

            <!-- Footer Links -->
            <div class="text-center mt-4 text-sm">
                <p>
                    Don't have an account?
                    <a href="#" class="text-blue-500 hover:underline">Sign Up</a>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import logo from "~/assets/logo/logo.svg"
import dark_logo from "~/assets/logo/logo_dark.svg"
import DarkModeBtn from "~/components/DarkModeBtn.vue";
import { sha3_384, sha3_256 } from "js-sha3";
import EC from "elliptic"
import { calSharedKey, genKeyCurve25519 } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";
import type { EncryptedRes } from "~/shared/Request/IEncryptRes";
useHead({
    title: "xva - fyp - Login Page ",
    meta: [{ name: "MsgFog login Page" }]
})

const turnstile = ref()

const username = ref('');
const password = ref('');
const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark)
//for btn

const goBack = () => {
    navigateTo({
        path: "/"
    })
}

// 登入邏輯
async function handleLogin() {
    if (username.value && password.value && (import.meta.dev || turnstile.value.success)) {

        // console.log(
        //     `Logging in with:\nUsername: ${username.value}\nPassword: ${password.value}`);
        let packet: any = {
            hash3_256_password: sha3_256(password.value),
            hash384_password: sha3_384(password.value),
            requestTime: new Date().toISOString(),
        };

        // 檢查 username.value 是否包含 @ 並且不是開頭或結尾
        const name = username.value.trim();
        const atIndex = name.indexOf('@');

        const isEmail = atIndex > 0 && atIndex < name.length - 1;

        if (isEmail) {
            packet.email = name;
        } else {
            packet.username = name;
        }

        let servPubKey = await $fetch("/api/ECDHpubkey")
        //gen key
        let pair = genKeyCurve25519()
        //calculate shared key
        let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

        //        console.log(shared);

        let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)

        encrypt["pubkey"] = pair.getPublic("hex")

        console.log(encrypt);

        sessionStorage.setItem("pri", pair.getPrivate("hex"))


        const req : EncryptedRes | any = await $fetch("/api/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(encrypt)
        })

        console.log(
            req
        );


        let d_res
        if (req.success) {
            d_res = await RequestEncryption.decryptMessage(req.encryptedMessage,shared,req.iv)
            console.log(JSON.parse(d_res));           

        }
        
        // //it is request

        //TODO : call api if pass next is otp else fail 


    } else {
        console.log('Please fill in both fields');
    }
}

</script>