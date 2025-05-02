<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-white dark:bg-dark-lighter rounded-xl w-full max-w-lg p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold dark:text-white">
          {{ type === 'story' ? 'Create Story' : 'Create Post' }}
        </h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <Icon name="bi:x-lg" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <!-- Image Upload -->
        <div class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer"
          :class="isDark ? 'border-gray-700' : 'border-gray-300'" @click="triggerFileInput">
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange">
          <div v-if="!selectedFile" class="space-y-2">
            <Icon name="bi:image" class="w-12 h-12 mx-auto text-gray-400" />
            <p class="text-gray-500">Click to upload image</p>
          </div>
          <img v-else :src="previewUrl" class="max-h-64 mx-auto rounded" alt="Preview">
        </div>

        <!-- Text Input (only for posts) -->
        <div v-if="type === 'post'" class="space-y-4">
          <input v-model="title" type="text" placeholder="Enter title..."
            class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
            :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'">
          <textarea v-model="content" placeholder="What's on your mind?" rows="4"
            class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
            :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'"></textarea>
        </div>

        <!-- Password Input (only for private mode) -->
        <div v-if="mode === 'private'" class="space-y-1">
          <label class="block text-sm font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Password</label>
          <input v-model="password" type="password" placeholder="Enter password"
            class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
            :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'">
        </div>

        <!-- Submit Button -->
        <button @click="submit"
          class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          :disabled="!isValid">
          {{ type === 'story' ? 'Share Story' : 'Share Post' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    validator: (value: string) => ['story', 'post'].includes(value)
  },
  mode: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'submit']);

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string>('');
const title = ref('');
const content = ref('');
const password = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    previewUrl.value = URL.createObjectURL(input.files[0]);
  }
};

const isValid = computed(() => {
  // if (!selectedFile.value) return false;
  if (props.type === 'post') {
    return title.value.trim() !== '' && content.value.trim() !== '';
  }
  return true;
});

const submit = async () => {
  if (!isValid.value) return;
  if (props.mode === 'private' && !password.value) {
    alert('Please enter a password for private content');
    return;
  }

  const formData = new FormData();
  if (selectedFile.value) {
    formData.append('image', await fileToBase64(selectedFile.value));
  }

  if (props.type === 'post') {
    formData.append('title', title.value);
    formData.append('content', content.value);
  }
  
  if (props.mode === 'private') {
    formData.append('password', password.value);
  }

  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }


  const result = await convertFormData(formData);
  emit('submit', result);
  //console.log(result); 
  close();
};

const close = () => {
  selectedFile.value = null;
  previewUrl.value = '';
  title.value = '';
  content.value = '';
  emit('close');
};

// Clean up object URL on component unmount
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>
