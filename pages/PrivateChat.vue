<template>
    <div class="min-h-screen bg-base-100 dark:bg-base-300">
      <!-- Navigation -->
      <header class="sticky top-0 z-50 bg-base-200/80 backdrop-blur-sm border-b border-base-content/10">
        <div class="flex items-center justify-between px-4 h-14">
          <div class="flex items-center flex-1">
            <template v-if="selectedFriend">
              <button 
                class="btn btn-ghost btn-sm btn-circle mr-2" 
                @click="selectedFriend = null"
              >
                <ArrowLeft class="w-4 h-4" />
              </button>
              <div class="flex items-center">
                <div class="avatar">
                  <div class="w-8 h-8 rounded-full">
                    <img :src="selectedFriend.avatar" :alt="selectedFriend.name" />
                  </div>
                </div>
                <div class="ml-3">
                  <h2 class="text-sm font-medium">{{ selectedFriend.name }}</h2>
                  <p v-if="selectedFriend.online" class="text-xs text-success">
                    Active now
                  </p>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- 添加返回按鈕和Chats標題 -->
              <button class="btn btn-ghost btn-sm btn-circle mr-2">
                <ArrowLeft class="w-4 h-4" />
              </button>
              <h1 class="text-sm font-medium">Chats</h1>
              <div class="relative ml-4 flex-1 max-w-md">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search messages..."
                  class="input input-sm input-bordered w-full pl-9 bg-base-100/50"
                />
                <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              </div>
            </template>
          </div>
  
          <div class="flex items-center gap-2">
            <button 
              class="btn btn-ghost btn-sm btn-circle" 
              @click="toggleTheme"
            >
              <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4" />
            </button>
            <button class="btn btn-ghost btn-sm btn-circle">
              <Settings class="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
  
      <!-- Main Content -->
      <main class="relative">
        <!-- Friends List -->
        <div 
          v-if="!selectedFriend" 
          class="h-[calc(100vh-3.5rem)] overflow-y-auto"
        >
          <div
            v-for="friend in filteredFriends"
            :key="friend.id"
            @click="selectFriend(friend)"
            class="flex items-center p-3 hover:bg-base-200/50 cursor-pointer"
          >
            <div class="avatar">
              <div class="w-10 h-10 rounded-full bg-primary/10">
                <img :src="friend.avatar" :alt="friend.name" class="rounded-full" />
              </div>
              <div 
                v-if="friend.online"
                class="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2"
                :class="isDarkMode ? 'border-base-300' : 'border-base-100'"
              ></div>
            </div>
            
            <div class="ml-3 flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="font-medium text-sm truncate">{{ friend.name }}</span>
                <span class="text-xs text-base-content/60">{{ friend.time }}</span>
              </div>
              <p class="text-sm text-base-content/60 truncate">
                {{ friend.lastMessage }}
              </p>
            </div>
          </div>
  
          <!-- 固定在右下角的添加按鈕 -->
          <button 
            @click="showAddContact"
            class="btn btn-primary btn-circle fixed right-4 bottom-4 shadow-lg"
          >
            <Plus class="w-6 h-6" />
          </button>
        </div>
  
      <!-- Chat Area -->
            <div v-else class="h-[calc(100vh-3.5rem)] flex flex-col">
                <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-2">
                <div
                    v-for="(message, index) in messages"
                    :key="index"
                    class="chat"
                    :class="{'chat-end': message.sender === 'me', 'chat-start': message.sender !== 'me'}"
                >
                    <div 
                    class="chat-bubble"
                    :class="{'bg-primary text-primary-content': message.sender === 'me'}"
                    >
                    {{ message.content }}
                    </div>
                    <div class="chat-footer opacity-50 text-xs">{{ message.time }}</div>
                </div>
                </div>
        
                <!-- Input Area -->
                <div class="p-4 border-t border-base-content/10 bg-base-200/50">
                <div class="flex items-center space-x-2">
                    <button class="btn btn-ghost btn-sm btn-circle">
                    <Plus class="w-4 h-4" />
                    </button>
                    <input
                    v-model="newMessage"
                    @keyup.enter="sendMessage"
                    type="text"
                    placeholder="Type a message..."
                    class="input input-sm input-bordered flex-1 bg-base-100/50"
                    />
                    <button 
                    class="btn btn-primary btn-sm btn-circle"
                    @click="sendMessage"
                    :disabled="!newMessage.trim()"
                    >
                    <Send class="w-4 h-4" />
                    </button>
                </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick  } from 'vue'
import { 
  ArrowLeft,
  Search,
  Plus,
  Send,
  Settings,
  Sun,
  Moon
} from 'lucide-vue-next'

interface Friend {
  id: number
  name: string
  avatar: string
  online: boolean
  lastMessage: string
  time: string
}

interface Message {
  sender: 'me' | 'other'
  content: string
  time: string
}

interface Conversations {
  [key: number]: Message[];
}

/*
const dashboardMenuItems = [
  { key: 'home', icon: 'Home', label: 'Home', route: '/' },
  { key: 'users', icon: 'Users', label: 'Users', route: '/users' },
  { key: 'messages', icon: 'MessageSquare', label: 'Messages', route: '/messages' },
  { key: 'notifications', icon: 'Bell', label: 'Notifications', route: '/notifications' },
  { key: 'analytics', icon: 'BarChart2', label: 'Analytics', route: '/analytics' }
]

const bottomItems = [
  { key: 'settings', icon: 'Settings', label: 'Settings', route: '/settings' },
  { key: 'logout', icon: 'LogOut', label: 'Logout' }
]

const themeClasses = computed(() => ({
  'bg-base-300': isDarkMode.value,
  'bg-base-100': !isDarkMode.value
}))
*/

// State
const isDarkMode = ref(false)
const selectedFriend = ref<Friend | null>(null)
const newMessage = ref('')
const searchQuery = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// 將主題相關邏輯移到 onMounted 中
const initTheme = () => {
  if (process.client) {
    const savedTheme = localStorage.getItem('theme') || 'light'
    isDarkMode.value = savedTheme === 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
}

const toggleTheme = () => {
  if (process.client) {
    isDarkMode.value = !isDarkMode.value
    const theme = isDarkMode.value ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

// Computed
const filteredFriends = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return friends.value
  
  return friends.value.filter(friend => 
    friend.name.toLowerCase().includes(query) ||
    friend.lastMessage.toLowerCase().includes(query)
  )
})

// Methods
const showAddContact = () => {
  // 實現添加聯絡人的邏輯
  console.log('Show add contact modal')
}

const selectFriend = async (friend: Friend) => {
  selectedFriend.value = friend
  try {
      // TODO: 1. Fetch messages from API instead of mock data using $fetch.
      const response = await $fetch<Message[]>(`/api/messages/${friend.id}`);
      messages.value = response || mockConversations[friend.id] || []; // 使用 API 數據或假數據
  } catch (error) {
      console.error("Failed to fetch messages from API:", error);
      messages.value = mockConversations[friend.id] || []; // 使用假數據
  }
  await nextTick()
  scrollToBottom()
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedFriend.value) return

  const content = newMessage.value
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })

  messages.value.push({
    sender: 'me',
    content,
    time
  })

  const friendIndex = friends.value.findIndex(f => f.id === selectedFriend.value?.id)
  if (friendIndex !== -1) {
    friends.value[friendIndex].lastMessage = content
    friends.value[friendIndex].time = 'just now'
  }

  newMessage.value = ''
  scrollToBottom()

  // Simulate API call
  // TODO: 2. Send message to API using $fetch.
  try {
      await $fetch('/api/sendMessage', { //Not yet finished
          method: 'POST',
          body: {
              friendId: selectedFriend.value.id,
              content: content,
              time: time
          }
      });
  } catch (error) {
      console.error("Failed to send message to API:", error);
      // Handle the error appropriately (e.g., display an error message)
  }
}
/*
const sendMessage = () => {
  if (!newMessage.value.trim() || !selectedFriend.value) return

  const newMsg: Message = {
    sender: 'me',
    content: newMessage.value,
    time: new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  messages.value.push(newMsg)
  
  // Update last message in friends list
  const friendIndex = friends.value.findIndex(f => f.id === selectedFriend.value?.id)
  if (friendIndex !== -1) {
    friends.value[friendIndex].lastMessage = newMessage.value
    friends.value[friendIndex].time = 'just now'
  }

  newMessage.value = ''
  scrollToBottom()

  // Simulate reply after 1-3 seconds
  if (Math.random() > 0.5) {
    setTimeout(() => {
      messages.value.push({
        sender: 'other',
        content: getRandomReply(),
        time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        })
      })
      scrollToBottom()
    }, 1000 + Math.random() * 2000)
  }
}
*/
// Mock friends data
const friends = ref<Friend[]>([
  {
    id: 1,
    name: 'Teresa Lai',
    avatar: 'https://i.pravatar.cc/150?img=1',
    online: true,
    lastMessage: 'Best birthday spa retreat ever!',
    time: '1:41 PM'
  },
  {
    id: 2,
    name: 'Rendy Del Rosario',
    avatar: 'https://i.pravatar.cc/150?img=2',
    online: true,
    lastMessage: 'At what time are we going to the movies?',
    time: '5:10 PM'
  },
  {
    id: 3,
    name: 'TechEnthusiast',
    avatar: 'https://i.pravatar.cc/150?img=3',
    online: true,
    lastMessage: 'Check out this new tech!',
    time: 'just now'
  },
  {
    id: 4,
    name: 'ArtisticSoul',
    avatar: 'https://i.pravatar.cc/150?img=4',
    online: false,
    lastMessage: 'Thanks for the feedback!',
    time: '2:30 PM'
  },
  {
    id: 5,
    name: 'TravelBug',
    avatar: 'https://i.pravatar.cc/150?img=5',
    online: true,
    lastMessage: 'The view here is amazing!',
    time: '3:45 PM'
  },
  {
    id: 6,
    name: 'FoodLover',
    avatar: 'https://i.pravatar.cc/150?img=6',
    online: false,
    lastMessage: 'Let\'s try that new restaurant!',
    time: 'Yesterday'
  },
  {
    id: 7,
    name: 'Ming Lee',
    avatar: 'https://i.pravatar.cc/150?img=7',
    online: false,
    lastMessage: 'Meeting tomorrow at 10?',
    time: 'Yesterday'
  },
  {
    id: 8,
    name: 'John Smith',
    avatar: 'https://i.pravatar.cc/150?img=8',
    online: false,
    lastMessage: 'Thanks for your help!',
    time: '2 days ago'
  }
])

const messages = ref<Message[]>([])

// Mock messages for different conversations
const mockConversations: Conversations = {
  1: [ // Teresa's messages
    {
      sender: 'other',
      content: 'Best birthday spa retreat ever, amirite?!! My face is glowing',
      time: '9:41 AM'
    },
    {
      sender: 'me',
      content: 'My face too. Thanks again for everything. You are the best!',
      time: '9:42 AM'
    },
    {
      sender: 'other',
      content: 'Anytime. Let me know if you want to link up again!',
      time: '1:41 PM'
    },
    {
      sender: 'me',
      content: 'Lets def go again. Best spa in the city!',
      time: '1:42 PM'
    }
  ],
  2: [ // Rendy's messages
    {
      sender: 'other',
      content: 'Hey',
      time: '5:09 PM'
    },
    {
      sender: 'other',
      content: 'At what time are we going to the movies?',
      time: '5:10 PM'
    },
    {
      sender: 'me',
      content: '8PM I think ...',
      time: '5:34 PM'
    },
    {
      sender: 'other',
      content: 'Testing visual challenge',
      time: '5:35 PM'
    },
    {
      sender: 'me',
      content: 'Cool :)',
      time: '5:35 PM'
    }
  ],
  3: [ // TechEnthusiast's messages
    {
      sender: 'other',
      content: 'Hi',
      time: '4:30 PM'
    },
    {
      sender: 'me',
      content: 'Who are you?🤔',
      time: '4:35 PM'
    }
  ]
}

/* useMessage
const selectFriend = (friend: Friend) => {
  selectedFriend.value = friend
  // Load conversation for selected friend
  messages.value = mockConversations[friend.id] || []
  scrollToBottom()
}


const selectFriend = async (friend: Friend) => {
  selectedFriend.value = friend
  // 這裡可以改為從API獲取消息
  messages.value = await fetchMessages(friend.id)
  await nextTick()
  scrollToBottom()
}
*/

// Random replies for demo
const getRandomReply = (): string => {
  const replies = [
    'That\'s interesting!',
    'Tell me more!',
    'Cool!',
    'Nice!',
    'Awesome!',
    'Really?',
    'I see!',
    'Great!',
    'Wow!',
    'Makes sense!'
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

/* Mock API calls
const fetchMessages = async (friendId: number) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockConversations[friendId] || []
}

const sendMessageToAPI = async (friendId: number, message: {content: string, time: string}) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('Message sent:', {friendId, message})
}
*/

// Lifecycle hooks
onMounted(() => {
  initTheme()
})
</script>

<style scoped>
/* 確保固定定位的按鈕始終顯示在視窗右下角 */
.fixed {
  position: fixed;
  z-index: 50;
}
/* 刪除循環引用的transition-all */
.smooth-transition {
  transition: all 300ms ease-in-out;
}

/* 聊天氣泡樣式 */
.chat-bubble {
  max-width: 80%;
  word-wrap: break-word;
}

/* 優化滾動條 */
::-webkit-scrollbar {
  width: 0.5rem;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--base-content), 0.2);
  border-radius: 9999px;
}

/* 添加陰影效果 */
.chat-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 添加hover效果 */
.hover-effect {
  transition: background-color 200ms ease;
}

.hover-effect:hover {
  background-color: var(--base-200);
}
</style>