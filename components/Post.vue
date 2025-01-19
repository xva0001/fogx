<template>
    <div class="  rounded-xl shadow-sm" :class="isDark ? 'bg-dark-lighter' : 'bg-white'">
                <!-- USER INFORMATION -->
                <div class="p-4">
                    <PostHeader :icon="icon" :username="username" :user-i-d="userID" :date="date" />

                    <!-- POST CONTENT -->
                    <h1 class="text-xl font-bold mb-4">Test Post</h1>
                    <div class="space-y-2 " :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                        <p>Hi</p>
                        <p>We are Msgfog</p>
                        <ImageBox v-if="images" class="pt-2" :images="images" />

                    </div>

                    <!-- TAGS -->
                    <div class="flex flex-wrap gap-2 mt-4">
                        <span class="px-3 py-1  rounded-full text-sm" v-for="tag_item in tags"
                            :class="isDark ? 'text-blue-400 bg-blue-900/30' : 'bg-blue-50  text-blue-600'">#{{ tag_item }}</span>
                        
                    </div>

                    <!-- ACTION BUTTONS -->
                    <div class="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-800">
                        <div class="flex space-x-6">
                            <button class="flex items-center space-x-2 text-gray-500 hover:text-pink-500">
                                <Icon name="bi:balloon-heart" class="h-5 w-5" />
                                <span>{{ like }}</span>
                            </button>
                            <button class="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                                <Icon name="bi:chat-left-dots" class=" w-5 h-5" />
                                <span>{{ comments }}</span>
                            </button>
                        </div>
                        <button class="rounded-full hover:text-green-500">
                            <Icon name="bi:share" class="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
</template>
<script setup lang="ts">
const props = defineProps({
    icon: { type: String, default: 'U' },
    username: { type: String, default: 'Anonymous' },
    userID: { type: String, default: 'unknown' },
    date: { type: [Date, String], default: new Date() },
    title: {type : String, required:true},
    content: {type : String, required:true},
    images: { type: Array as PropType<string[]>, required: false },
    tags: { type: Array as PropType<string[]>, required: false },
    like : { type : Number , default : 0},
    comments : { type : Number , default : 0}
})

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

</script>