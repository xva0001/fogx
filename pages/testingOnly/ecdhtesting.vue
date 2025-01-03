<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-2xl font-bold mb-4">ECDH Key Pair Generator & Encryption</h1>
      <div class="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
        <h2 class="text-lg font-semibold mb-2">Key Pair Generator</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Select Curve for Key Pair 1:</label>
          <select v-model="curve1" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            <option value="curve25519">curve25519</option>
            <option value="secp256k1">secp256k1</option>
            <option value="p256">p256</option>
          </select>
          <label class="block text-sm font-medium text-gray-700 mt-2">Select Curve for Key Pair 2:</label>
          <select v-model="curve2" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            <option value="curve25519">curve25519</option>
            <option value="secp256k1">secp256k1</option>
            <option value="p256">p256</option>
          </select>
        </div>
        <button @click="generateKeyPairs" class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Generate Key Pairs</button>
        
        <h2 class="text-lg font-semibold mt-4">Key Pair 1</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Public Key:</label>
          <textarea v-model="keyPair1.publicKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="2" readonly></textarea>
          <label class="block text-sm font-medium text-gray-700 mt-2">Private Key:</label>
          <textarea v-model="keyPair1.privateKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="2" readonly></textarea>
        </div>
        
        <h2 class="text-lg font-semibold">Key Pair 2</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Public Key:</label>
          <textarea v-model="keyPair2.publicKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="2" readonly></textarea>
          <label class="block text-sm font-medium text-gray-700 mt-2">Private Key:</label>
          <textarea v-model="keyPair2.privateKey" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="2" readonly></textarea>
        </div>
        
        <h2 class="text-lg font-semibold mt-4">AES with ECC Shared Key Encryption / Decryption</h2>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Message:</label>
          <input v-model="message" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
          <button @click="encryptMessage" class="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Encrypt Message</button>
          <p v-if="encryptedMessage" class="mt-2"><strong>Encrypted:</strong> {{ encryptedMessage }}</p>
          <!-- <p v-if="iv" class="mt-2"><strong>IV (can be public) :</strong> {{ iv }}</p> -->
          <button @click="decryptMessage" class="w-full mt-2 px-4 py-2  bg-gray-800 text-white rounded-md hover:bg-yellow-600">Decrypt Message</button>
          <p v-if="decryptedMessage" class="mt-2"><strong>Decrypted:</strong> {{ decryptedMessage }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  
  import { ref } from 'vue';
  import EC from 'elliptic';
  import forge from 'node-forge';
  import { sha3_384 } from 'js-sha3';
  
  useHead({
    title: "ECDH Key Pair Generator & Encryption"
  })


  const curve1 = ref('curve25519');
  const curve2 = ref('secp256k1');
  const keyPair1 = ref({ publicKey: '', privateKey: '' });
  const keyPair2 = ref({ publicKey: '', privateKey: '' });
  const sharedKey = ref('');
  const message = ref('');
  const encryptedMessage = ref('');
  const decryptedMessage = ref('');

  const keysize = 32
  
  function generateKeyPairs() {
    const ec1 = new EC.ec(curve1.value);
    const ec2 = new EC.ec(curve2.value);
    const pair1 = ec1.genKeyPair();
    const pair2 = ec2.genKeyPair();
  
    keyPair1.value.publicKey = pair1.getPublic('hex');
    keyPair1.value.privateKey = pair1.getPrivate('hex');
  
    keyPair2.value.publicKey = pair2.getPublic('hex');
    keyPair2.value.privateKey = pair2.getPrivate('hex');
  
    const shared = pair1.derive(pair2.getPublic());
    
    sharedKey.value = forge.util.encode64(
        forge.pkcs5.pbkdf2(
            sha3_384(shared.toString(16)),shared.toString(16),5000,128));
    //avoid rainbow attack
  }
 
  
  let iv = ref()

  function encryptMessage() {
    iv.value = forge.random.getBytesSync(16)
    if (!message.value || !sharedKey.value) {
      console.log('Generate keys and enter a message to encrypt');
      return;
    }
    const cipher = forge.cipher.createCipher('AES-CBC', sharedKey.value.substring(0,keysize));
    cipher.start({ iv: iv.value });
    cipher.update(forge.util.createBuffer(message.value, 'utf8'));
    cipher.finish();
    encryptedMessage.value = forge.util.encode64(cipher.output.getBytes());
  }
  
  function decryptMessage() {
    if (!encryptedMessage.value || !sharedKey.value) {
      console.log('No encrypted message or shared key available');
      return;
    }
    //console.log(233);
    //iv = forge.random.getBytesSync(16)//NEED ORIGINAL IV
    const decipher = forge.cipher.createDecipher('AES-CBC', sharedKey.value.substring(0,keysize));
    decipher.start({ iv: iv.value });
    decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedMessage.value)));
    const result = decipher.finish();
    if (result) {
      decryptedMessage.value = decipher.output.toString();
    } else {
      console.log('Failed to decrypt message');
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
  