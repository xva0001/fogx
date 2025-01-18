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
                    <NuxtTurnstile ref="turnstile" />
                    <div class="text-sm text-gray-500">
                        By clicking Next, you agree to our Terms, Privacy Policy and Cookies Policy.
                    </div>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex justify-between gap-4">
                    <button v-if="currentStep > 0" 
                        type="button"
                        @click="currentStep--"
                        class="px-6 py-2 rounded-lg border"
                        :class="isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'">
                        Back
                    </button>
                    <button type="submit" 
                        class="flex-grow py-2 rounded-lg text-white focus:outline-none"
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

<script setup>
import logo from "~/assets/logo/logo.svg"
import dark_logo from "~/assets/logo/logo_dark.svg"
import DarkModeBtn from "~/components/DarkModeBtn.vue";

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
const stepTitles = {
    0: "Let's start with your basic information",
    1: "Choose how you'll appear",
    2: "Create a strong password",
    3: "Verify your identity"
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

function handleRegister() {
    if (import.meta.dev  || turnstile.value.success) {
        alert('Account created successfully!');
        navigateTo('/login', { replace: true });    
    }
    // For now, skip verification check and just redirect
    
    
    /* Original verification logic commented out for now
    if (!turnstile.value.success) {
        alert('Please complete the verification');
        return;
    }
    */
}
</script>
