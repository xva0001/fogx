<template>
    <div
        :class="`flex xl:text-xl items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`">
        <div :class="`shadow-lg rounded-lg p-8 w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`">
            <!-- Back Button -->
            <div class="flex justify-between mb-4">
                <button @click="goBack" class="px-3 py-1 rounded-lg border text-md flex items-center"
                    :class="isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'">
                    <Icon name="material-symbols:arrow-left-alt" class="w-5 h-5 mr-2" />
                    Back
                </button>
                <DarkModeBtn />
            </div>

            <!-- Logo & Title -->
            <div class="flex flex-col items-center mb-6">
                <NuxtImg :src="isDark ? dark_logo : logo" alt="Logo" class="w-24 h-24 mb-2"
                    :class="isDark ? 'text-white' : 'text-black'">
                </NuxtImg>
                <h1 class="text-2xl font-bold">Create Account</h1>
                <p class="text-sm text-gray-500 mt-2">{{ stepTitles[currentStep] }}</p>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-1 bg-gray-200 rounded-full mb-6">
                <div class="h-full bg-blue-500 rounded-full transition-all duration-300"
                    :style="`width: ${(currentStep + 1) * (100 / totalSteps)}%`"></div>
            </div>

            <!-- Form Fields -->
            <form @submit.prevent="handleNextStep" class="space-y-4">
                <!-- Step 1: Basic Info -->
                <div v-if="currentStep === 0" class="space-y-4">
                    <div>
                        <label for="fullName" class="block mb-1">Full Name</label>
                        <input v-model="fullName" id="fullName" type="text" placeholder="Enter your full name"
                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            required />
                    </div>
                    <div>
                        <label for="email" class="block mb-1">Email</label>
                        <input v-model="email" id="email" type="email" placeholder="Enter your email"
                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            required />
                    </div>
                </div>

                <!-- Step 2: Username -->
                <div v-if="currentStep === 1" class="space-y-4">
                    <div>
                        <label for="username" class="block mb-1">Choose your username</label>
                        <input v-model="username" id="username" type="text" placeholder="@username"
                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            required />
                        <p class="text-sm text-gray-500 mt-2">This will be your unique identifier on the platform</p>
                    </div>
                </div>

                <!-- Step 3: Password -->
                <div v-if="currentStep === 2" class="space-y-4">
                    <div>
                        <label for="password" class="block mb-1">Create Password</label>
                        <input v-model="password" id="password" type="password"
                            placeholder="At least 8 characters with numbers and letters"
                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            required />
                    </div>
                    <div>
                        <label for="confirmPassword" class="block mb-1">Confirm Password</label>
                        <input v-model="confirmPassword" id="confirmPassword" type="password"
                            placeholder="Confirm your password"
                            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            required />
                    </div>
                </div>

                <!-- Step 4: Verification -->
                <div v-if="currentStep === 3" class="space-y-4">

                    <!-- 2FA Section -->
                    <div class="p-4 border rounded max-w-sm mx-auto">
                        <h2 class="text-lg font-bold mb-2">Two-Factor Authentication</h2>
                        <p class="text-sm mb-2">Scan this QR code with your authenticator app:</p>
                        <img :src="imgdata" alt="QR Code" class="block mb-4 w-48 h-48 mx-auto" />

                        <p class="text-sm mb-2">
                            If you can't scan the QR code, enter this key manually:
                            <strong class="text-xs break-all">{{ key }}</strong>
                        </p>

                        <!-- Input for user to enter their TOTP from the authenticator app -->
                        <div class="flex items-center mb-4 gap-2">
                            <input 
                                v-model="userCode" 
                                type="text" 
                                placeholder="Enter 6-digit code"
                                class="border p-2 rounded w-32 text-sm"
                                :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                            />
                            <button 
                                @click="verifyCode" 
                                class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                                Verify
                            </button>
                        </div>

                        <!-- Display verification result -->
                        <div v-if="verificationResult !== null" class="mb-4">
                            <p v-if="verificationResult" class="text-sm text-green-600 font-semibold">
                                ✓ Code verified successfully
                            </p>
                            <p v-else class="text-sm text-red-600 font-semibold">
                                ✗ Invalid code, please try again
                            </p>
                        </div>

                        <!-- Backup Codes -->
                        <div class="mt-4">
                            <h3 class="text-sm font-semibold mb-1">Backup Codes</h3>
                            <div class="grid grid-cols-2 gap-2">
                                <div 
                                    v-for="code in backupCodes" 
                                    :key="code" 
                                    class="text-xs p-1 bg-gray-100 rounded text-center"
                                    :class="isDark ? 'bg-gray-700' : 'bg-gray-100'"
                                >
                                    {{ code }}
                                </div>
                            </div>
                        </div>
                    </div>


                    <NuxtTurnstile ref="turnstile" />
                    <div class="text-sm text-gray-500">
                        By clicking Next, you agree to our Terms, Privacy Policy and Cookies Policy.
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between gap-4">
                    <button v-if="currentStep > 0" type="button" @click="currentStep--"
                        class="px-6 py-2 rounded-lg border"
                        :class="isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'">
                        Back
                    </button>
                    <button type="submit" class="flex-grow py-2 rounded-lg text-white focus:outline-none"
                        :class="isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'">
                        {{ currentStep === totalSteps - 1 ? 'Create Account' : 'Next' }}
                    </button>
                </div>
            </form>

            <!-- Footer Links -->
            <div class="text-center mt-4 text-sm">
                <p>
                    Have an account?
                    <NuxtLink to="/login" class="text-blue-500 hover:underline">Log in</NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import logo from "~/assets/logo/logo.svg"
import dark_logo from "~/assets/logo/logo_dark.svg"
import DarkModeBtn from "~/components/DarkModeBtn.vue";
import { SecFATool } from "~/shared/2FATool"
import { twoFAQRGenerator } from '~/composables/2faQRimg';
import { sha3_256, sha3_384 } from "js-sha3";
import { calSharedKey, genKeyCurve25519 } from "~/shared/useKeyFn";
import RequestEncryption from "~/shared/Request/requestEncrytion";

useHead({
    title: "xva - fyp - Register Page",
    meta: [{ name: "MsgFog Register Page" }]
})

const turnstile = ref()

const email = ref('');
const fullName = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark)

const currentStep = ref(0);
const totalSteps = 4;
const stepTitles :{
    [key: number]: string;
} = {
    0: "Let's start with your basic information",
    1: "Choose how you'll appear",
    2: "Create a strong password",
    3: "Verify your identity"
};

const key = ref("");
const imgdata = ref("");
const userCode = ref("");
const verificationResult = ref<boolean | null>(null);
const backupCodes = ref<string[]>([]);

const $TOTPvalidator = SecFATool();

onMounted(async () => {
    key.value = $TOTPvalidator.generateKey();
    
    try {
        imgdata.value = await twoFAQRGenerator.genQR(
            "Your App Name",
            email.value || "user",
            key.value
        );
        
        backupCodes.value = $TOTPvalidator.generateBackupCodes(8);
    } catch (error) {
        console.error("Error generating QR code:", error);
    }
});

const verifyCode = () => {
    if (!userCode.value) return;
    
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    verificationResult.value = $TOTPvalidator.validator(
        key.value,
        userCode.value,
        currentCounter,
        { drift: 2 }
    );
};

const goBack = () => {
    navigateTo({
        path: "/"
    })
}

function handleNextStep() {
    if (currentStep.value === totalSteps - 1) {
        handleRegister();
    } else {
        // Validate current step
        if (currentStep.value === 0 && (!email.value || !fullName.value)) {
            alert('Please fill in all fields');
            return;
        }
        if (currentStep.value === 1 && !username.value) {
            alert('Please choose a username');
            return;
        }
        if (currentStep.value === 2) {
            if (!password.value || !confirmPassword.value) {
                alert('Please fill in both password fields');
                return;
            }
            if (password.value !== confirmPassword.value) {
                alert('Passwords do not match');
                return;
            }
        }
        currentStep.value++;
    }
}


interface RegistrationResponse {
    success: boolean;
    message?: string;
}

async function handleRegister() {
    if (!verificationResult.value) {
        alert('Please complete 2FA verification first');
        return;
    }
    
    if (import.meta.dev || turnstile.value.success) {
        try {
            // TODO: 1. Prepare registration data (email, username, password, 2FA key, etc.).
            const registrationData = {
                email: email.value,
                username: username.value,
                sha3_384_password : sha3_384(password.value),
                sha3_256_password : sha3_256(password.value),
                twoFAKey: key.value,
                backupCodes: backupCodes.value,
                twoFAPassword:userCode.value,
                requestTime : new Date().toISOString()
                // Add other necessary data
            };
            let packet = registrationData

            const pair = genKeyCurve25519()

            let servPubKey = await $fetch("/api/ECDHpubkey")

            let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))
            //under control for this any
            let encrypt :any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)

            encrypt["pubkey"] = pair.getPublic("hex")

            sessionStorage.setItem("pri",pair.getPrivate("hex"))


            // TODO: 2. Send registration data to the server using $fetch.
            const registrationResponse = await $fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(encrypt),
            });

            console.log(registrationResponse);
            
            return



            // TODO: 3. Handle the server response (success or failure).
            if (registrationResponse.success) {
                alert('Account created successfully!');
                navigateTo('/login', { replace: true });
            } else {
                alert(`Registration failed: ${registrationResponse.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            alert(`Registration failed: ${error.message || 'An unexpected error occurred'}`);
        }
    }
}
</script>
