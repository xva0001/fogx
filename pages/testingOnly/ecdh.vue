<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-2xl font-bold mb-4">ECDH Key Exchange</h1>
      <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Your Public Key:</label>
          <textarea v-model="publicKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" readonly></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Partner's Public Key:</label>
          <input v-model="partnerPublicKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <button @click="generateKeys" class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Generate Keys</button>
        <button @click="computeSharedKey" class="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Compute Shared Key</button>
        <div v-if="sharedKey" class="mt-4 p-2 bg-gray-200 rounded-md">
          <p><strong>Shared Key:</strong> {{ sharedKey }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import EC from 'elliptic';
  
  const ecdh = ref<EC.ec.KeyPair | null>(null);
  const publicKey = ref('');
  const partnerPublicKey = ref('');
  const sharedKey = ref('');
  
  function generateKeys() {
    const ec = new EC.ec('curve25519');
    ecdh.value = ec.genKeyPair();
    publicKey.value = ecdh.value.getPublic('hex');
  }
  
  function computeSharedKey() {
    if (!partnerPublicKey.value) {
      alert('Please enter partner public key');
      return;
    }
    try {
      const ec = new EC.ec('curve25519');
      const partnerKey = ec.keyFromPublic(partnerPublicKey.value, 'hex');
      const shared = ecdh.value?.derive(partnerKey.getPublic());
      sharedKey.value = shared?.toString(16) || '';
    } catch (error) {
      console.error(error);
      alert('Invalid partner public key');
    }
  }
  </script>
  
  <style scoped>
  textarea {
    @apply mt-1 block w-full border-gray-300 rounded-md shadow-sm;
  }
  input {
    @apply mt-1 block w-full border-gray-300 rounded-md shadow-sm;
  }
  </style>
  