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
              :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" required />
          </div>
          <div>
            <label for="email" class="block mb-1">Email</label>
            <input v-model="email" id="email" type="email" placeholder="Enter your email"
              class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" required />
          </div>
        </div>

        <!-- Step 2: Username -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div>
            <label for="username" class="block mb-1">Choose your username</label>
            <input v-model="username" id="username" type="text" placeholder="@username"
              class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" required />
            <p class="text-sm text-gray-500 mt-2">This will be your unique identifier on the platform</p>
          </div>
        </div>

        <!-- Step 3: Password -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div>
            <label for="password" class="block mb-1">Create Password</label>
            <div class="flex items-center">
              <input v-model="password" id="password" :type="showPassword ? 'text' : 'password'"
                placeholder="At least 8 characters with numbers and letters"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" required
                @input="checkPasswordStrength" />
              <!-- <input type="checkbox" id="show-password" class="ml-2" v-model="showPassword" /> -->
              <!-- <label for="show-password" class="ml-1">Reveal</label> -->
               <button class="btn  bg-transparent" @click.prevent="seePassBtn" >
                <Icon :name="showPassword?'bi:eye-slash':'bi:eye'" />
              </button>
            </div>
            <div class="pt-2">
              <span>Password Strength :</span>
            </div>
            <div class="mt-4 flex justify-center mb-3">
              
              <div class="w-full ">
                <progress class="progress w-56" :class="passwordStrengthClass" :value="progr" max="100"></progress>
                <!-- <div class="strength-meter h-2 rounded-full" :class="passwordStrengthClass"
                  :style="{ width: passwordStrengthWidth }"></div> -->
                  <!-- <span class="ml-2">{{ passwordStrengthText }}</span> -->
                <p>{{ passwordStrengthText }}</p>
              </div>
              
            </div>
            <div class="flex items-center">
              <button @click.prevent="newOpenWin" ><Icon name="bi:question"/><span>see details</span></button>
            </div>
          </div>
          <div>
            <label for="confirmPassword" class="block mb-1">Confirm Password</label>
            <div class="flex items-center">
              <input v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" required />
              <!-- <input type="checkbox" id="show-confirm-password" class="ml-2" v-model="showConfirmPassword" /> -->

            </div>
            <div class="flex items-center pt-2">
              <button type="button" @click="generateStrongPassword"
                class="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                <Icon name="bi:key" />
                <span>Generate Strong Password</span>
              </button>
            </div>
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

            <!-- Refresh QR Code Button -->
            <button type="button" @click="refreshQRCode" class="text-sm text-blue-500 hover:underline">
              Refresh QR Code
            </button>

            <!-- Input for user to enter their TOTP from the authenticator app -->
            <div class="flex items-center mb-4 gap-2">
              <input v-model="userCode" type="text" placeholder="Enter 6-digit code"
                class="border p-2 rounded w-32 text-sm"
                :class="isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'" />
              <button @click.prevent="verifyCode"
                class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
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
                <div v-for="code in backupCodes" :key="code" class="text-xs p-1 bg-gray-100 rounded text-center"
                  :class="isDark ? 'bg-gray-700' : 'bg-gray-100'">
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
          <button v-if="currentStep > 0" type="button" @click="currentStep--" class="px-6 py-2 rounded-lg border"
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
import passwordAnalyzer from "~/composables/PasswordAnalyze";

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
const stepTitles: {
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

const qrScanned = ref(false);
const attemptCount = ref(0);
const maxAttempts = 5;
const showPassword = ref(false);
const showConfirmPassword = ref(false);

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

const refreshQRCode = async () => {
  key.value = $TOTPvalidator.generateKey();
  try {
    imgdata.value = await twoFAQRGenerator.genQR(
      "Your App Name",
      email.value || "user",
      key.value
    );
    backupCodes.value = $TOTPvalidator.generateBackupCodes(8);
    qrScanned.value = false;
  } catch (error) {
    console.error("Error refreshing QR code:", error);
  }
};

const verifyCode = () => {
  if (qrScanned.value) {
    alert('You have already scanned the QR code. Please complete the registration or refresh the QR code.');
    return;
  }

  if (!userCode.value) return;
  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  verificationResult.value = $TOTPvalidator.validator(
    key.value,
    userCode.value,
    currentCounter,
    { drift: 2 }
  );

  if (!verificationResult.value) {
    attemptCount.value++;
    if (attemptCount.value >= maxAttempts) {
      alert('Maximum attempts reached. Please try again later or contact support.');

    }
  } else {
    qrScanned.value = true;
    attemptCount.value = 0;
  }
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
        sha3_384_password: sha3_384(password.value),
        sha3_256_password: sha3_256(password.value),
        twoFAKey: key.value,
        backupCodes: backupCodes.value,
        twoFAPassword: userCode.value,
        requestTime: new Date().toISOString()
        // Add other necessary data
      };
      let packet = registrationData

      const pair = genKeyCurve25519()

      let servPubKey = await $fetch("/api/ECDHpubkey")

      let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))
      //under control for this any
      let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)

      encrypt["pubkey"] = pair.getPublic("hex")

      sessionStorage.setItem("pri", pair.getPrivate("hex"))

      // TODO: 2. Send registration data to the server using $fetch.
      const registrationResponse = await $fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encrypt),
      });

      console.log(registrationResponse);

      // TODO: 3. Handle the server response (success or failure).
      if ('success' in registrationResponse && registrationResponse.success) {
        alert('Account created successfully!');
        navigateTo('/login', { replace: true });
      } else {
        alert(`Registration failed: ${registrationResponse || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message || 'An unexpected error occurred'}`);
    }
  }
}

const passwordStrengthClass = ref('');
const passwordStrengthText = ref('');
const passwordStrengthWidth = ref('');
const progr = ref(0)
const seePassBtn= ()=>{
  showPassword.value = showPassword.value?false:true
  console.log(showConfirmPassword.value);
  
}
//#region 
//-----********//////////////////////-----------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------- */
//#regionend 

function checkPasswordStrength(): void {
  // 重置狀態
  let strength = 0;
  const {score,entropy,meetsRequirements} = passwordAnalyzer.getPasswordScore(password.value)
  strength = score
  // 平滑過渡進度條
  console.log(score);
  console.log(entropy);
  
  animateProgress(calculateProgress(strength,meetsRequirements));

  // 更新UI狀態
  updatePasswordStrengthUI(strength,entropy,meetsRequirements);
}

// 計算進度值（0-100）
function calculateProgress(strength: number,meetsRequirements:boolean): number {
  if (!meetsRequirements) {
    return 0
  }
  return Math.min(100, Math.round(strength*100));
}

// 平滑動畫效果
function animateProgress(targetProgress: number): void {
  const duration = 500; // 動畫持續時間（毫秒）
  const startTime = performance.now();
  const startProgress = progr.value;

  function updateProgress(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 使用緩動函數使動畫更自然
    const easedProgress = easeOutQuad(progress);
    progr.value = Math.floor(
      startProgress + (targetProgress - startProgress) * easedProgress
    );

    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    }
  }

  requestAnimationFrame(updateProgress);
}

// 緩動函數
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

// 更新UI顯示
function updatePasswordStrengthUI(strength: number,entropy:number,meetsRequirements:boolean): void {

  if (!meetsRequirements) {
    passwordStrengthText.value = "None";
    passwordStrengthClass.value = "";
    return;
  }
  // 更精細的強度分類
  if (entropy<20) {
    passwordStrengthText.value = "Weak";
    passwordStrengthClass.value = "progress-error";
  } else if (entropy < 35) {
    passwordStrengthText.value = "Medium";
    passwordStrengthClass.value = "progress-warning";
  } else if (entropy <= 60) {
    passwordStrengthText.value = "Good";
    passwordStrengthClass.value = "progress-primary";
  } else {
    passwordStrengthText.value = "Strong";
    passwordStrengthClass.value = "progress-success";
  }
}
const generateStrongPassword = (): void => {
  // 定義字符集（可擴展）
  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };

  // 配置選項（可調整）
  const config = {
    minLength: 12,
    maxLength: 20,
    requiredSets: [
      charSets.lowercase,
      charSets.uppercase,
      charSets.numeric,
      charSets.symbols
    ],
    additionalChars: 8 // 在必備字符基礎上增加的隨機字符數
  };

  try {
    // 1. 確保包含所有必備字符集中的至少一個字符
    let passVal = '';
    config.requiredSets.forEach(set => {
      passVal += getRandomChar(set);
    });

    // 2. 添加額外隨機字符
    const allChars = Object.values(charSets).join('');
    for (let i = 0; i < config.additionalChars; i++) {
      passVal += getRandomChar(allChars);
    }

    // 3. 打亂並截取適當長度
    passVal = shuffleString(passVal);
    passVal = passVal.substring(0, Math.min(
      Math.max(passVal.length, config.minLength),
      config.maxLength
    ));

    // 4. 驗證生成的密碼
    if (!isPasswordStrong(passVal, charSets)) {
      throw new Error('Generated password does not meet strength requirements');
    }

    // 5. 設置密碼值
    password.value = passVal;
    confirmPassword.value = passVal;
    checkPasswordStrength();

    console.log('Successfully generated strong password');
  } catch (error) {
    console.error('Password generation failed:', error);
    // 可選：回退到簡單密碼或重試
    fallbackPasswordGeneration();
  }
};

// 輔助函數：檢查密碼強度
const isPasswordStrong = (password: string, charSets: Record<string, string>): boolean => {
  return (
    password.length >= 12 &&
    Object.values(charSets).every(set => 
      [...set].some(char => password.includes(char))
  ))
};

// 示例回退方案
const fallbackPasswordGeneration = (): void => {
  password.value = generateBasicPassword();
  confirmPassword.value = password.value;
  checkPasswordStrength();
};

// 基本密碼生成（示例）
const generateBasicPassword = (): string => {
  return Math.random().toString(36).slice(2) + 
         Math.random().toString(36).toUpperCase().slice(2);
};

const getRandomChar = (str: string) => str.charAt(Math.floor(Math.random() * str.length));
//const getRandomInt = (max: number) => Math.floor(Math.random() * max);
const shuffleString = (str: string) => {
  let arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
};


// watch(showPassword, () => {
// });
// watch(showConfirmPassword, () => {
// });

const  newOpenWin =  async ()=>{
  await navigateTo("/passwordStandard",{
    open:{
      target:"_blank"
    }
  })
}

</script>