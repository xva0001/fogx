<template>
    <div class=" dark: rounded-xl shadow-sm p-4" :class="isDark ? 'bg-dark-lighter' : 'bg-white'">
        
        
        <div class=" items-start space-x-3">
            <PostHeader  :icon="icon" :username="username" :user-i-d="userID" :date="date"  />
            <p class="mt-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ content }}</p>
        </div>

    </div>
</template>
<script setup lang="ts">

const props = defineProps({
    icon: { type: String },
    username: { type: String ,required:true },
    userID: { type: String,required:true },
    date: { type: Date ,required:true},
    content:{type:String,required:true}

})


const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);



</script>