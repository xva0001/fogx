// pages/keygen.vue
<template>
  <div class="p-8 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">RSA, ECC & ED25519 Key Generator</h1>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold">RSA Key Generator</h2>
      <button @click="generateRSAKeys" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Generate RSA Keys</button>
      <div v-if="rsaKeys" class="mt-4">
        <p><strong>Public Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ rsaKeys.publicKey }}</textarea>
        <p><strong>Private Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ rsaKeys.privateKey }}</textarea>
      </div>
    </div>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold">ECC Key Generator (secp256r1)</h2>
      <button @click="generateECCKeys" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Generate ECC Keys</button>
      <div v-if="eccKeys" class="mt-4">
        <p><strong>Public Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ eccKeys.publicKey }}</textarea>
        <p><strong>Private Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ eccKeys.privateKey }}</textarea>
      </div>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold">ED25519 Key Generator</h2>
      <button @click="generateED25519Keys" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Generate ED25519 Keys</button>
      <div v-if="ed25519Keys" class="mt-4">
        <p><strong>Public Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ed25519Keys.publicKey }}</textarea>
        <p><strong>Private Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ed25519Keys.privateKey }}</textarea>
      </div>
    </div>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold">ECC Key Generator (secp384r1)</h2>
      <button @click="generateECC384Keys" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Generate ECC Keys (384-bit)</button>
      <div v-if="ecc384Keys" class="mt-4">
        <p><strong>Public Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ecc384Keys.publicKey }}</textarea>
        <p><strong>Private Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ecc384Keys.privateKey }}</textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import forge from 'node-forge';

const rsaKeys = ref(null);
const eccKeys = ref(null);
const ecc384Keys = ref(null);
const ed25519Keys = ref(null);

function generateRSAKeys() {
  const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  rsaKeys.value = {
    publicKey: forge.pki.publicKeyToPem(rsaKeyPair.publicKey),
    privateKey: forge.pki.privateKeyToPem(rsaKeyPair.privateKey),
  };
}

function generateECCKeys() {
  const eccKeyPair = forge.pki.ec.generateKeyPair({ namedCurve: 'secp256r1' });
  eccKeys.value = {
    publicKey: forge.pki.publicKeyToPem(eccKeyPair.publicKey),
    privateKey: forge.pki.privateKeyToPem(eccKeyPair.privateKey),
  };
}

function generateECC384Keys() {
  const eccKeyPair = forge.pki.ec.generateKeyPair({ namedCurve: 'secp384r1' });
  ecc384Keys.value = {
    publicKey: forge.pki.publicKeyToPem(eccKeyPair.publicKey),
    privateKey: forge.pki.privateKeyToPem(eccKeyPair.privateKey),
  };
}

function generateED25519Keys() {
  const keypair = forge.pki.ed25519.generateKeyPair();
  ed25519Keys.value = {
    publicKey: forge.util.bytesToHex(keypair.publicKey),
    privateKey: forge.util.bytesToHex(keypair.privateKey),
  };
}
</script>

<style>
textarea {
  font-family: monospace;
  font-size: 0.9rem;
  margin-bottom: 10px;
}
</style>
