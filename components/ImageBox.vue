<template>
    <div class="relative"  @mouseenter="showControls"
    @mousemove="showControls"
    @mouseleave="startAutoHide" >
        <div ref="carousel"
            class="flex overflow-x-auto space-x-4 snap-x snap-mandatory scrollbar-hide rounded-lg border border-gray-200 dark:border-gray-700 scroll-smooth">
            <img v-for="(image, index) in images" 
                :key="index" 
                :src="image" 
                alt="Image"
                class="w-full object-cover rounded-lg snap-center shrink-0"
                ref="imageRefs"
            />
        </div>

        <!-- 左按鈕 -->
        <button @click="scrollLeft"
        :disabled="currentIndex === 0"
        class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-700/50 text-white p-2 rounded-full z-10"
        :class="[
        currentIndex === 0 ? ' hidden' : 'hover:bg-gray-800',
        showControlsFlag ? 'opacity-100' : 'opacity-0'
        ]"
         
         >
            <Icon name="bi:arrow-bar-left" />
        </button>

        <!-- 右按鈕 -->
        <button @click="scrollRight"
        class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-700/50 text-white p-2 rounded-full z-10"
        :class="
        [currentIndex === images.length - 1 ? ' hidden' : 'hover:bg-gray-800',
        showControlsFlag ? 'opacity-100' : 'opacity-0']">

            <Icon name="bi:arrow-bar-right" />
        </button>
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-gray-800/70 px-3 py-1 rounded-lg text-sm"
         :class="showControlsFlag ? 'opacity-100' : 'opacity-0'"
        >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { ref, nextTick } from 'vue';

const props = defineProps({
    images: { type: Array as PropType<string[]>, required: true }
});

// Refs
const carousel = ref<HTMLElement | null>(null);
const imageRefs = ref<Array<HTMLElement | null>>([]);
const currentIndex = ref(0);

const showControlsFlag = ref(true); // 控制按鈕和指示器顯示
let hideControlsTimeout: ReturnType<typeof setTimeout> | null = null; // 明確類型

// Scroll Left
const scrollLeft = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        scrollToImage();
    }
};

// Scroll Right
const scrollRight = () => {
    if (currentIndex.value < props.images.length - 1) {
        currentIndex.value++;
        scrollToImage();
    }
};

// Scroll to Specific Image
const scrollToImage = async () => {
    await nextTick(); // Ensure DOM updates are applied
    const carouselEl = carousel.value;
    const targetImage = imageRefs.value[currentIndex.value];

    if (carouselEl && targetImage) {
        carouselEl.scrollTo({
            left: targetImage.offsetLeft - carouselEl.offsetLeft,
            behavior: 'smooth'
        });
    }
};
// // 跳轉到指定圖片
// const goToImage = (index : number) => {
//   currentIndex.value = index;
//   scrollToImage();
// };


// 顯示控制項
const showControls = () => {
  showControlsFlag.value = true;
  startAutoHide();
};

// 自動隱藏控制項
const startAutoHide = () => {
  if (hideControlsTimeout) {
    clearTimeout(hideControlsTimeout);
  }
  hideControlsTimeout = setTimeout(() => {
    showControlsFlag.value = false;
  }, 1000); // 1秒後隱藏
};

// 初始設置
onMounted(() => {
  startAutoHide();
});


</script>

<style scoped>
/* Hide Scrollbar */
.scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}
</style>
