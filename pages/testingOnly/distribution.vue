<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="bg-white shadow-md rounded p-6 w-full max-w-xl">
        <h1 class="text-2xl font-bold mb-6 text-center">訊息分割與合併工具(Shamir Secret Sharing) </h1>
  
        <!-- 輸入訊息 -->
        <div class="mb-4">
          <label class="block text-gray-700 mb-1">輸入訊息：</label>
          <textarea
            v-model="message"
            class="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
            rows="3"
            placeholder="請輸入需要分割的訊息"
          ></textarea>
        </div>
  
        <!-- 設定分割參數 -->
        <div class="mb-4 flex space-x-4">
          <div class="w-1/2">
            <label class="block text-gray-700 mb-1">總分割份數：</label>
            <input
              v-model.number="totalShares"
              type="number"
              min="1"
              class="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="例：4"
            />
          </div>
          <div class="w-1/2">
            <label class="block text-gray-700 mb-1">還原所需份數：</label>
            <input
              v-model.number="threshold"
              type="number"
              min="1"
              class="w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="例：3"
            />
          </div>
        </div>
  
        <!-- 按鈕操作 -->
        <div class="mb-6 flex justify-between">
          <button
            @click="splitMessage"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none"
          >
            分割訊息
          </button>
          <button
            @click="combineMessage"
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none"
          >
            合併選擇的訊息段
          </button>
        </div>
  
        <!-- 顯示分割後的訊息段與勾選 -->
        <div class="mb-4">
          <label class="block text-gray-700 mb-1">分割後的訊息段 (選擇以合併)：</label>
          <div class="border rounded p-3 bg-gray-50 min-h-[100px]">
            <div v-if="shares.length === 0" class="text-gray-500">尚未產生分割訊息段</div>
            <div v-for="(share, index) in shares" :key="index" class="flex items-center mb-1">
              <input
                type="checkbox"
                v-model="selectedShares"
                :value="share"
                class="mr-2"
              />
              <span class="font-mono text-sm">{{ share }}</span>
            </div>
          </div>
        </div>
  
        <!-- 顯示合併後的密文 -->
        <div>
          <label class="block text-gray-700 mb-1">合併後的密文：</label>
          <div class="border rounded p-3 bg-gray-50 min-h-[50px]">
            <span class="font-mono text-sm">{{ combinedMessage }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { Buffer } from "buffer";
  import { secrets as secretsInstance } from 'easy-shamir-secret-sharing';
  
  const message = ref('');
  const totalShares = ref(4);
  const threshold = ref(3);
  const shares = ref<string[]>([]);
  const selectedShares = ref<string[]>([]);
  const combinedMessage = ref('');
  
  
  async function splitMessage() {
    if (!message.value) {
      alert('請先輸入訊息');
      return;
    }
    try {
      const arr = await secretsInstance.share(message.value, totalShares.value, threshold.value);
      shares.value = arr;
      selectedShares.value = [];
      combinedMessage.value = '';
    } catch (error) {
      console.error('分割訊息發生錯誤:', error);
    }
  }

  async function combineMessage() {
    try {
      const combined = await secretsInstance.combine(selectedShares.value);
      combinedMessage.value = combined;
    } catch (error) {
      console.error('合併訊息發生錯誤:', error);
    }
  }
  </script>
  