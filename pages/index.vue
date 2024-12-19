

<template>
    <div class="flex flex-col items-center justify-center min-h-screen dark:bg-gray-700 bg-gray-100 p-4">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">Nuxt 3 Testing Page</h1>
        <p class="text-gray-600 dark:text-white mb-6">Enter some text and run a test:</p>
        <div class="w-full max-w-md">
            <input v-model="testInput" type="text" placeholder="Enter your test input here"
                class="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring focus:ring-blue-300" />
            <p v-if="testInput.trim()" class="font-bold  text-3xl mb-4 text-gray-800 dark:text-gray-200">
                You entered: <span class="text-blue-500">{{ testInput }}</span>
            </p>
            <p v-else class="font-bold text-3xl text-gray-800 dark:text-gray-200 mb-4">
                Please start typing above!
            </p>
            <button @click="runTest" class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                Run Test
            </button>
            <button @click="goToSecondPage" class="w-full bg-red-500 text-white py-2 my-2 rounded hover:bg-blue-600">
                second page
            </button>
        </div>
        <div v-if="testResult"
            class="mt-6 p-4 border border-green-300 bg-green-100 rounded w-full max-w-md text-green-800">
            <h2 class="text-xl font-semibold">Test Results</h2>
            <p>{{ testResult }}</p>
        </div>
    </div>
</template>

<script setup>

definePageMeta({
    name: "testing App - First page"
    
})


const testInput = ref("");
const testResult = ref("");
const router = useRouter();
// Clear testResult when the input changes
watch(testInput, () => {
  testResult.value = "";
});

function runTest() {
  if (testInput.value.trim() === "") {
    testResult.value = "Please enter some text to test! (Nothing here)";
  } else {
    testResult.value = `Test successful! You entered: "${testInput.value}"`;
  }
}
const goToSecondPage = ()=>{
    return navigateTo({
        path:"/Home"
    })
}
</script>