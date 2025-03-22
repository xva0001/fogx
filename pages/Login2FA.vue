<template>
    <div
        :class="`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`">
        <div :class="`shadow-lg rounded-lg p-8 w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`">

            <!-- Header -->
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
                <h1 class="text-2xl font-bold">Two-Factor Authentication</h1>
                <p class="text-sm">{{ isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled' }}</p>
            </div>

            <!-- Theme Toggle -->
            <div class="flex justify-end mb-4">
                <DarkModeBtn />
            </div>

            <!-- 2FA Form -->
            <form @submit.prevent="handle2FASubmit" class="space-y-4">
                <!-- 2FA Code Input -->
                <div>
                    <label for="2fa-code" class="block mb-1">Enter 6-digit code</label>
                    <input v-model="code" id="2fa-code" type="number" placeholder="••••••"
                        class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                        required
                        maxlength="6"
                        pattern="[0-9]{6}">
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="text-red-500 text-sm">
                    {{ errorMessage }}
                </div>

                <!-- Submit Button -->
                <button type="submit" class="w-full py-2 rounded-lg text-white focus:outline-none"
                    :class="isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'">
                    Verify
                </button>
<!-- 
                !-- Countdown Timer --
                <div class="text-center text-sm">
                    <p v-if="countdown > 0">
                        Reset code in {{ countdown }} seconds
                    </p>
                </div> -->
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import logo from "~/assets/logo/logo.svg"
import dark_logo from "~/assets/logo/logo_dark.svg"
import DarkModeBtn from "~/components/DarkModeBtn.vue";


const isDark = useThemeStore().isDark;
// 2FA Code
const code = ref('');

// Error Message
const errorMessage = ref('');

// Countdown
const countdown = ref(30)
const countdownInterval = ref(null);

// Go back to login page
const goBack = () => {
    navigateTo('/login');
};

// Handle 2FA submission
const handle2FASubmit = async () => {
    try {
        if (code.value.length !== 6) {
            errorMessage.value = 'Please enter a 6-digit code';
            return;
        }

        // Clear error message
        errorMessage.value = '';

        // Validate 2FA code
        //await loginStore.validate2FA(code.value); //

        // If successful, emit event to handle next step
        // You can modify this based on your store implementation
        // navigateTo('/dashboard');




        // //Handle successful 2FA validation
        //TODO : Update user login state based on server response

        const response = await $fetch('/api/2FA/vaildator.post', {  // 2FA validation API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code.value }),
        });

        if (response.success) {
            navigateTo('/dashboard');
        } else {
            errorMessage.value = response.message || 'Invalid code. Please try again.';
        }        
    } catch (error) {
        errorMessage.value = 'Invalid code. Please try again.';
    }
};

// // Resend code functionality
// const resetCode = () => {
//     // Implement resend logic here
//     // This should trigger your backend to send a new 2FA code
//     startCountdown();
// };

// // Start countdown
// const startCountdown = () => {
//     countdown.value = 30;
//     clearInterval(countdownInterval.value);
//     countdownInterval.value = setInterval(() => {
//         countdown.value -= 1;
//         if (countdown.value <= 0) {
//             clearInterval(countdownInterval.value);
//             code.value = ''; // Clear input after countdown ends
//         }
//         if (countdown.value==0) {
//             countdown.value= 30 //reset
//         }
//     }, 1000);
// };

// // Initialize countdown on component mount
// onMounted(() => {
//     startCountdown();
// });
</script>
