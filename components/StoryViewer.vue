<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black flex items-center justify-center">
    <!-- Close button -->
    <button @click="close" class="absolute top-4 right-4 text-white">
      <Icon name="bi:x-lg" class="w-6 h-6" />
    </button>
    
    <!-- Story content -->
    <div class="relative w-full max-w-lg h-[80vh]">
      <!-- Navigation buttons -->
      <button v-if="currentIndex > 0" 
              @click="prevStory" 
              class="absolute left-4 top-1/2 -translate-y-1/2 text-white">
        <Icon name="bi:chevron-left" class="w-8 h-8" />
      </button>
      
      <button v-if="currentIndex < stories.length - 1" 
              @click="nextStory" 
              class="absolute right-4 top-1/2 -translate-y-1/2 text-white">
        <Icon name="bi:chevron-right" class="w-8 h-8" />
      </button>

      <!-- Story image -->
      <img :src="currentStory.image" 
           class="w-full h-full object-contain" 
           :alt="currentStory.username">
      
      <!-- User info -->
      <div class="absolute top-4 left-4 flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
          <img :src="currentStory.userImage" 
               class="w-full h-full object-cover" 
               :alt="currentStory.username">
        </div>
        <span class="text-white font-medium">{{ currentStory.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: Boolean,
  stories: Array,
  initialIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close']);

const currentIndex = ref(props.initialIndex);

const currentStory = computed(() => props.stories[currentIndex.value]);

const close = () => {
  emit('close');
};

const nextStory = () => {
  if (currentIndex.value < props.stories.length - 1) {
    currentIndex.value++;
  }
};

const prevStory = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};
</script> 