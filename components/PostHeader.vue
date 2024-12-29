<template>
    <div class="flex items-center space-x-3 mb-4">
        <!-- User Icon -->
        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-xl text-white font-bold">{{ icon || 'U' }}</span>
        </div>

        <!-- User Details -->
        <div>
            <div class="flex items-center space-x-2">
                <span class="font-bold">{{ username || 'Anonymous' }}</span>
                <span class="text-gray-500">@{{ userID || 'unknown' }}</span>
                <span class="text-gray-500">·</span>
                <span class="text-gray-500">{{ displayTime }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    icon: { type: String, default: 'U' },
    username: { type: String, default: 'Anonymous' },
    userID: { type: String, default: 'unknown' },
    date: { type: [Date, String], default: new Date() }
});

// Determine if the time should display relative or absolute
const displayTime = computed(() => {
    const dateObj = props.date instanceof Date ? props.date : new Date(props.date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    // Show relative time if less than 24 hours
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } 

    // Otherwise, show formatted date
    return dateObj.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
});
</script>
