<template>
    <div class="flex items-start space-x-3 p-4 rounded-xl" :class="isDark ? 'bg-dark-lighter' : 'bg-gray-50'">
      <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
        <img v-if="icon && icon.startsWith('data:image')"
             :src="icon"
             :alt="`${username}'s avatar`"
             class="w-full h-full object-cover">
        <span v-else class="text-gray-500 dark:text-gray-400 font-bold text-sm">
          {{ username ? username.charAt(0).toUpperCase() : '?' }}
        </span>
      </div>
      <div class="flex-1">
        <div class="flex items-center space-x-2">
          <span class="font-semibold">{{ username }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">@{{ userID }} · {{ formatTimeAgo(date) }}</span>
        </div>
        <p class="mt-1 text-sm" :class="isDark ? 'text-gray-300' : 'text-gray-100'">{{ content }}</p>
      </div>
    </div>
  </template>
<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
    icon: { type: String, default: '' },
    username: { type: String ,required:true },
    userID: { type: String,required:true },
    date: { type: [Date, String] ,required:true},
    content:{type:String,required:true}

})


const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

// 如果 date prop 是 string，需要轉換
const formattedDate = computed(() => {
    const dateObj = typeof props.date === 'string' ? new Date(props.date) : props.date;
    // 在這裡調用你的 formatTimeAgo 函數
    // return formatTimeAgo(dateObj);
    // 或者直接顯示簡單格式
    return dateObj.toLocaleString();
});

const isCurrentUserComment = computed(() => {
  // 檢查ID格式並確保一致比較
  const currentUserID = sessionStorage.getItem('CUUID');
  console.log("Compare IDs:", {
    commentUserID: props.userID,
    currentUserID: currentUserID
  });
  return props.userID === currentUserID;
});

const formatTimeAgo = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

onMounted(() => {
  console.log("Comment userID:", props.userID);
  console.log("Current user ID:", sessionStorage.getItem('CUUID'));
});
</script>