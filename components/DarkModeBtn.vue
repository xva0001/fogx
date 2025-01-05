<template>
    <button @click="toggleDarkMode" class="p-2 rounded-full theme-controller" 
                        :class="isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'">
                        <template v-if="isDark" class="w-5 h-5">
                            <Icon name="bi:brightness-high" />
                        </template>
                        <template v-else class="w-5 h-5">
                            <Icon name="bi:moon" />
                        </template>
                    </button>
</template>
<script setup lang="ts">
const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const toggleDarkMode = () => {
    DarkMode.toggleIsDark();
};

</script>