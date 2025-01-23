<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-white dark:bg-dark-lighter rounded-xl w-full max-w-md p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold dark:text-white">Share Post</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <Icon name="bi:x-lg" class="w-6 h-6" />
        </button>
      </div>

      <!-- Share Options -->
      <div class="grid grid-cols-3 gap-4">
        <!-- Copy Link -->
        <button 
          @click="copyLink"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:link-45deg" class="w-8 h-8 text-blue-500" />
          <span class="text-sm dark:text-white">Copy Link</span>
        </button>

        <!-- Share to Twitter -->
        <a 
          :href="twitterShareUrl"
          target="_blank"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:twitter" class="w-8 h-8 text-blue-400" />
          <span class="text-sm dark:text-white">Twitter</span>
        </a>

        <!-- Share to Facebook -->
        <a 
          :href="facebookShareUrl"
          target="_blank"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:facebook" class="w-8 h-8 text-blue-600" />
          <span class="text-sm dark:text-white">Facebook</span>
        </a>

        <!-- Share to LinkedIn -->
        <a 
          :href="linkedinShareUrl"
          target="_blank"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:linkedin" class="w-8 h-8 text-blue-700" />
          <span class="text-sm dark:text-white">LinkedIn</span>
        </a>

        <!-- Share to WhatsApp -->
        <a 
          :href="whatsappShareUrl"
          target="_blank"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:whatsapp" class="w-8 h-8 text-green-500" />
          <span class="text-sm dark:text-white">WhatsApp</span>
        </a>

        <!-- Share to Email -->
        <a 
          :href="emailShareUrl"
          class="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-dark"
        >
          <Icon name="bi:envelope" class="w-8 h-8 text-gray-600 dark:text-gray-400" />
          <span class="text-sm dark:text-white">Email</span>
        </a>
      </div>

      <!-- Copy Link Success Message -->
      <div v-if="showCopySuccess" 
           class="mt-4 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-center">
        Link copied to clipboard!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: Boolean,
  post: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const showCopySuccess = ref(false);

// Generate share URLs
const postUrl = computed(() => {
  // In production, replace with actual URL
  return `${window.location.origin}/post/${props.post.id}`;
});

const encodedTitle = computed(() => encodeURIComponent(props.post.title));
const encodedUrl = computed(() => encodeURIComponent(postUrl.value));

const twitterShareUrl = computed(() => 
  `https://twitter.com/intent/tweet?text=${encodedTitle.value}&url=${encodedUrl.value}`
);

const facebookShareUrl = computed(() => 
  `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}`
);

const linkedinShareUrl = computed(() => 
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl.value}`
);

const whatsappShareUrl = computed(() => 
  `https://wa.me/?text=${encodedTitle.value}%20${encodedUrl.value}`
);

const emailShareUrl = computed(() => 
  `mailto:?subject=${encodedTitle.value}&body=Check%20out%20this%20post:%20${encodedUrl.value}`
);

// Copy link function
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(postUrl.value);
    showCopySuccess.value = true;
    setTimeout(() => {
      showCopySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const close = () => {
  emit('close');
};
</script> 