<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div :class="`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-xl w-full max-w-md p-6`">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 :class="`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`">
          Add Friend
        </h2>
        <button @click="close" :class="`text-gray-500 hover:text-gray-700 ${isDark ? 'text-gray-200' : 'text-gray-500'}`">
          <Icon name="bi:x-lg" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <!-- Friend ID Input -->
        <div class="space-y-1">
          <label :class="`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`">
            Friend ID
          </label>
          <input 
            v-model="friendId" 
            type="text" 
            placeholder="Enter friend's ID"
            :class="`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500
                   ${isDark ? 'bg-dark-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`"
          >
        </div>

        <!-- Submit Button -->
        <button 
          @click="submit"
          :class="`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                 disabled:opacity-50 ${isDark ? 'hover:bg-blue-600' : 'hover:bg-blue-600'}`"
          :disabled="!friendId.trim()"
        >
          Add Friend
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'submit']);

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const friendId = ref('');

const submit = () => {
  if (!friendId.value.trim()) return;
  emit('submit', friendId.value);
  close();
};

const close = () => {
  friendId.value = '';
  emit('close');
};
</script>
