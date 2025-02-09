<script>
// @deprecated, wrongn use
</script>
<template>
  <div class="p-8 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">ED25519 Encryption & Decryption</h1>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold">Generate ED25519 Key Pair</h2>
      <button @click="generateED25519Keys" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Generate Keys</button>
      <div v-if="ed25519Keys" class="mt-4">
        <p><strong>Public Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ed25519Keys.publicKey }}</textarea>
        <p><strong>Private Key:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ ed25519Keys.privateKey }}</textarea>
      </div>
    </div>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold">Encrypt Message</h2>
      <textarea v-model="message" placeholder="Enter a message to encrypt" class="w-full p-2 border rounded"></textarea>
      <button @click="encryptMessage" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2">Encrypt</button>
      <div v-if="encryptedMessage" class="mt-4">
        <p><strong>Encrypted Message:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ encryptedMessage }}</textarea>
      </div>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold">Decrypt Message</h2>
      <button @click="decryptMessage" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Decrypt</button>
      <div v-if="decryptedMessage" class="mt-4">
        <p><strong>Decrypted Message:</strong></p>
        <textarea readonly class="w-full p-2 border rounded bg-gray-100">{{ decryptedMessage }}</textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import forge from 'node-forge';

const ed25519Keys = ref<{ publicKey: string; privateKey: string } | null>(null);
const message = ref('');
const encryptedMessage = ref('');
const decryptedMessage = ref('');

function generateED25519Keys() {
    const keypair = forge.pki.ed25519.generateKeyPair();
    ed25519Keys.value = {
        publicKey: forge.util.bytesToHex(keypair.publicKey),
        privateKey: forge.util.bytesToHex(keypair.privateKey),
    };
}

function encryptMessage() {
    if (!ed25519Keys.value || !message.value) {
        console.warn('Keys or message not available');
        return;
    }
    const publicKey = forge.util.hexToBytes(ed25519Keys.value.publicKey);
    const messageBytes = forge.util.encodeUtf8(message.value);
    const count = Math.min(messageBytes.length, publicKey.length);
    const encrypted = forge.util.encode64(
        forge.util.xorBytes(messageBytes, publicKey, count)
    );
    encryptedMessage.value = encrypted;
}

function decryptMessage() {
    
    if (!ed25519Keys.value || !encryptedMessage.value) {
        console.warn('Keys or encrypted message not available');
        return;
    }

    // Convert private key from hex to bytes
    const privateKey = forge.util.hexToBytes(ed25519Keys.value.privateKey);

    // Decode the base64 encrypted message
    let decrypted;
    try {
        decrypted = forge.util.decode64(encryptedMessage.value);
    } catch (error) {
        console.error('Error decoding base64 encrypted message:', error);
        return;
    }

    const count = Math.min(decrypted.length, privateKey.length);
    
    // Perform XOR decryption
    const decryptedBytes = forge.util.xorBytes(decrypted, privateKey, count);

    // Check if the result is a valid UTF-8 string
    //console.log(forge.util.decodeUtf8(decryptedBytes));
    
    try {
        decryptedMessage.value = forge.util.encode64(decryptedBytes);
    } catch (error) {
        console.error('Error decoding UTF-8 message:', error);
        return;
    }
}

</script>

<style>
textarea {
  font-family: monospace;
  font-size: 0.9rem;
  margin-bottom: 10px;
}
</style>
