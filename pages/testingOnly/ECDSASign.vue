<template>
  <div class="p-10 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">ECDSA 簽署與驗證</h1>
    <div class="mb-4">
      <textarea
        v-model="message"
        class="w-full p-2 border rounded"
        rows="4"
        placeholder="輸入要簽署的消息"
      ></textarea>
      <textarea v-model="privateKey" ></textarea>
      <textarea v-model="publicKey" ></textarea>
      <textarea v-model="signature" ></textarea>
    </div>

    <button
      @click="generateKeys"
      class="bg-blue-500 text-white p-2 rounded mb-4 w-full"
    >
      生成密鑰對
    </button>
    <button
      @click="signMessage"
      class="bg-green-500 text-white p-2 rounded mb-4 w-full"
      :disabled="!privateKey"
    >
      簽署消息
    </button>
    <button
      @click="verifySignature"
      class="bg-purple-500 text-white p-2 rounded w-full"
      :disabled="!signature"
    >
      驗證簽名
    </button>

    <div v-if="signature" class="mt-4">
      <p class="break-all">簽名: {{ signature }}</p>
    </div>

    <div
      v-if="verificationResult !== null"
      :class="verificationResult ? 'text-green-500' : 'text-red-500'"
      class="mt-2"
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
  let isValid = keyv.verify(hexMess,signature.value)
  verificationResult.value = isValid;
  //alert(isValid ? '驗證成功！' : '驗證失敗！');
};
</script>
