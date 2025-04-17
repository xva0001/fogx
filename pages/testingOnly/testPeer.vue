<template>
    <div class="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h1 class="text-2xl font-bold text-blue-600 mb-4">🔌 PeerJS 連線測試</h1>
        
        <div v-if="peerId">
          <p class="text-green-600 font-medium">✅ 已連線！</p>
          <p class="text-gray-700 mt-2">你的 Peer ID 是：</p>
          <div class="mt-2 font-mono bg-gray-100 p-2 rounded text-sm">{{ peerId }}</div>
        </div>
  
        <div v-else-if="error">
          <p class="text-red-600 font-medium">❌ 連線失敗：</p>
          <p class="mt-2 text-sm text-gray-600">{{ error }}</p>
        </div>
  
        <div v-else>
          <p class="text-gray-500">連線中...</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import Peer from 'peerjs'
  
  const peerId = ref('')
  const error = ref('')
  
  onMounted(() => {
    const peer = new Peer({
      host: '127.0.0.1',
      port: 9000,
      path: '/PeerApp',
    })
  
    peer.on('open', (id) => {
      peerId.value = id
    })
  
    peer.on('error', (err) => {
      error.value = err.message
    })
  })
  </script>
  