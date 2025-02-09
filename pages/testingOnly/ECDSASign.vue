<template>
  <div class="p-10 max-w-xl mx-auto bg-white rounded-2xl shadow-xl">
    <h1 class="text-3xl font-extrabold mb-6 text-center text-blue-600">
      ECDSA 簽署與驗證
    </h1>

    <div class="space-y-4">
      <div>
        <label for="message" class="block text-gray-700 font-medium mb-1">消息</label>
        <textarea
          id="message"
          v-model="message"
          class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          rows="4"
          placeholder="輸入要簽署的消息"
        ></textarea>
      </div>

      <div>
        <label for="privateKey" class="block text-gray-700 font-medium mb-1">私鑰</label>
        <textarea
          id="privateKey"
          v-model="privateKey"
          class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          rows="3"
          placeholder="輸入私鑰"
        ></textarea>
      </div>

      <div>
        <label for="publicKey" class="block text-gray-700 font-medium mb-1">公鑰</label>
        <textarea
          id="publicKey"
          v-model="publicKey"
          class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          rows="3"
          placeholder="輸入公鑰"
        ></textarea>
      </div>

      <div>
        <label for="signature" class="block text-gray-700 font-medium mb-1">簽名</label>
        <textarea
          id="signature"
          v-model="signature"
          class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          rows="3"
          placeholder="簽名結果"
        ></textarea>
      </div>
    </div>

    <div class="space-y-3 mt-6">
      <button
        @click="generateKeys"
        class="w-full bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition-all"
      >
        生成密鑰對
      </button>

      <button
        @click="signMessage"
        class="w-full bg-green-600 text-white p-3 rounded-lg shadow-md hover:bg-green-700 transition-all"
        :disabled="!privateKey"
      >
        簽署消息
      </button>

      <button
        @click="verifySignature"
        class="w-full bg-purple-600 text-white p-3 rounded-lg shadow-md hover:bg-purple-700 transition-all"
        :disabled="!signature"
      >
        驗證簽名
      </button>
    </div>

    <div v-if="signature" class="mt-6">
      <p class="text-gray-700 break-all font-mono bg-gray-100 p-3 rounded-md">
        簽名: {{ signature }}
      </p>
    </div>

    <div
      v-if="verificationResult !== null"
      :class="verificationResult ? 'text-green-600' : 'text-red-600'"
      class="mt-4 text-lg font-semibold"
    >
      {{ verificationResult ? '驗證成功' : '驗證失敗' }}
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import EC from 'elliptic';
import forge from 'node-forge';
import { sha3_384 } from 'js-sha3';
import { Buffer} from 'buffer'
// 定義響應式狀態
const message = ref<string>('');
const privateKey = ref<string>('');
const publicKey = ref<string>('');
const signature = ref<string >("");
const verificationResult = ref<boolean | null>(null);
let ec : EC.ec;
//let reCurve = null;

// 生成密鑰對
const generateKeys = () => {
  ec = new EC.ec('ed25519');
  const keypair = ec.genKeyPair()
  privateKey.value = keypair.getPrivate('hex');
  publicKey.value = keypair.getPublic('hex');
  //alert('密鑰對生成成功！');
  
};

// 使用私鑰簽署消息
const signMessage = () => {
  if (!message.value) {
    alert('請輸入消息！');
    return;
  }
  const kp = ec.keyFromPrivate(privateKey.value,'hex')
  const hexMess = sha3_384(message.value);
  let signString = kp.sign(hexMess)

  signature.value = signString.toDER("hex")

};

// 使用公鑰驗證簽名
const verifySignature = () => {

  const keyv = ec.keyFromPublic(publicKey.value,"hex")
  const hexMess = sha3_384(message.value);
  let isValid
  try{
  isValid = keyv.verify(hexMess,signature.value)}
  catch(e){
    isValid = false
  }
  verificationResult.value = isValid;
  //alert(isValid ? '驗證成功！' : '驗證失敗！');
};
</script>
