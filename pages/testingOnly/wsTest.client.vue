<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'
import { ref, watch } from 'vue'

const { status, data, send, open, close } = useWebSocket('ws://localhost/_ws', {
  immediate: false,
  autoReconnect: false, // Disabled for testing disconnect
  heartbeat: {
    message: JSON.stringify({ type: 'ping' }),
    interval: 3000,
    pongTimeout: 1000
  }
})
const messages = ref<{type: string, content: string, timestamp: Date}[]>([])
const connKey = 'key' // Matching server expected ConnKey

// Handle incoming messages
watch(() => data.value, (newData) => {
  if (newData) {
    const timestamp = new Date()
    try {
      const parsed = JSON.parse(newData)
      if (parsed.type === 'ping') {
        messages.value.push({
          type: 'ping',
          content: 'Ping received',
          timestamp
        })
      } else {
        messages.value.push({
          type: 'message', 
          content: newData,
          timestamp
        })
      }
    } catch {
      messages.value.push({
        type: 'message',
        content: newData,
        timestamp
      })
    }
    console.log('Received:', newData)
  }
})

function connect() {
  open()
}

function sendAuth() {
  send(JSON.stringify({ ConnKey: connKey }))
}

function sendTestMessage() {
  send(JSON.stringify({ 
    ConnKey: connKey,
    message: 'Test message from client' 
  }))
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">WebSocket Test</h2>
    <p class="mb-4">
      Status: 
      <span :class="{
        'text-green-500': status === 'OPEN',
        'text-red-500': status === 'CLOSED',
        'text-yellow-500': status === 'CONNECTING'
      }">
        {{ status }}
      </span>
    </p>
    
    <div class="flex flex-wrap gap-2 mb-6">
      <button 
        @click="connect"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Connect
      </button>
      <button 
        @click="sendAuth"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
      >
        Authenticate
      </button>
      <button 
        @click="sendTestMessage"
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
      >
        Send Test
      </button>
      <button 
        @click="(e) => {
          try {
            close()
            console.log('Disconnect initiated')
          } catch (err) {
            console.error('Disconnect failed:', err)
          }
        }"
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Disconnect
      </button>
    </div>
    
    <div v-if="messages.length" class="mt-4">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Received Messages:</h3>
      <ul class="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
        <li 
          v-for="(msg, index) in messages" 
          :key="index"
          class="py-2 px-3 mb-2 bg-white rounded shadow-sm"
        >
          {{ msg }}
        </li>
      </ul>
    </div>
  </div>
</template>
