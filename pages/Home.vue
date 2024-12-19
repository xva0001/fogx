<template>
    <div
        class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 p-4">
        <h2 class="text-4xl font-bold mb-6">Welcome to the Second Page</h2>
        <p class="text-lg mb-8 text-center max-w-md">
            This is the second page of your application. Click the button below to return to the home page.
        </p>
        <button @click="goToHome"
            class="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300">
            Go to Home Page
        </button>
    </div>
</template>

<script setup>

definePageMeta({
    name: "testing App - Second page"
    
})
//const router = useRouter();

// Function to navigate to the home page
function goToHome() {
    return navigateTo({
        path: "/"
    })
}
</script>