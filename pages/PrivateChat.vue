<template>
  <!-- Use the base-100/base-300 classes on the outermost div -->
  <div class="min-h-screen" :class="isDarkMode ? 'bg-base-300' : 'bg-base-100'">
    <!-- Sidebar -->
    <Sidebar
      v-model:expanded="sidebarExpanded"
      :items="navigationItems"
      :bottom-items="bottomItems"
      :active-key="currentRoute"
      @item-click="handleNavigate"
    />

    <!-- Main Content Wrapper with Dynamic Margin -->
    <div
      class="transition-all duration-500 ease-in-out"
      :style="{ marginLeft: sidebarExpanded ? '16rem' : '4rem' }"
    >
      <!-- Header (Now inside the wrapper) -->
      <header class="sticky top-0 z-40 bg-base-200/80 backdrop-blur-sm border-b border-base-content/10">
        <!-- Header content remains the same -->
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

      <!-- Main Content (Now inside the wrapper) -->
      <main class="relative">
        <!-- Friends List -->
        <div
          v-if="!selectedFriend"
          class="h-[calc(100vh-3.5rem)] overflow-y-auto"
        >
          <!-- Friends list content remains the same -->
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
          <!-- Chat area content remains the same -->
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
                      <div v-if="message.images" class="mt-2 space-y-2">
                        <img
                          v-for="(img, idx) in message.images"
                          :key="idx"
                          :src="img"
                          class="max-w-xs rounded-lg"
                          @click="openImageModal(img)"
                        />
                      </div>
                      <div v-if="message.isCall" class="mt-2 flex items-center gap-2">
                        <span>{{ message.callAccepted ? 'Call accepted' : 'Call request' }}</span>
                        <button
                          v-if="message.sender === 'other' && !message.callAccepted"
                          class="btn btn-sm btn-success"
                          @click="acceptCall(message)"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                    <div class="chat-footer opacity-50 text-xs">{{ message.time }}</div>
                </div>
                </div>

                <!-- Input Area -->
                <div class="p-4 border-t border-base-content/10 bg-base-200/50">
                <div class="flex items-center space-x-2">
                    <div class="dropdown dropdown-top">
                      <button class="btn btn-ghost btn-sm btn-circle">
                        <Plus class="w-4 h-4" />
                      </button>
                      <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <label>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              class="hidden"
                              @change="handleImageUpload"
                            />
                            Upload Images
                          </label>
                        </li>
                        <li><button @click="startCall(false)"><Phone class="w-4 h-4" /> Voice Call</button></li>
                        <li><button @click="startCall(true)"><Video class="w-4 h-4" /> Video Call</button></li>
                      </ul>
                    </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  ArrowLeft,
  Search,
  Plus,
  Send,
  Settings,
  Sun,
  Moon,
  Phone,
  Video
} from 'lucide-vue-next'
import { Peer, type DataConnection } from 'peerjs'
import { usePeerConnection, type PeerConnectionOptions } from '~/composables/usePeerConnection'
import { useMessage } from '~/composables/useMessage'
import Sidebar from '~/components/Sidebar.vue';
import type { MenuItem } from '~/composables/IMenu';
import {
  Home,
  Search as SearchIconSidebar,
  Bell,
  MessageCircle,
  Bookmark,
  Settings as SettingsIconSidebar,
  User,
  LogOut,
} from 'lucide-vue-next'


interface Friend {
  id: number
  name: string
  avatar: string
  online: boolean
  lastMessage: string
  time: string
  peerId?: string
}

interface Message {
  sender: 'me' | 'other'
  content: string
  time: string
  images?: string[] // Base64 encoded images
  isCall?: boolean
  callAccepted?: boolean
}

interface Conversations {
  [key: number]: Message[];
}

const sidebarExpanded = ref(false);
const currentRoute = ref('messages');

const navigationItems = computed<MenuItem[]>(() => [
  { key: 'home', icon: Home, label: 'Home', route: '/' },
  { key: 'explore', icon: SearchIconSidebar, label: 'Explore', route: '/explore' },
  { key: 'messages', icon: MessageCircle, label: 'Messages', route: '/messages' }, // Highlight messages
  { key: 'notifications', icon: Bell, label: 'Notifications', route: '/notifications' },
  { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks', route: '/bookmarks' },
  // Add other relevant items like Private Content if needed
  { key: 'private', icon: SearchIconSidebar, label: 'Private Content', route: '/Private' }
]);

const bottomItems = computed<MenuItem[]>(() => [
  { key: 'settings', icon: SettingsIconSidebar, label: 'Settings', route: '/settings' },
  { key: 'profile', icon: User, label: 'Profile', route: '/profile' },
  { key: 'logout', icon: LogOut, label: 'Logout' }
]);

const handleNavigate = (item: MenuItem) => {
  if (item.key === 'logout') {
    logout();
  }
  currentRoute.value = item.key;
  if (item.route) {
    navigateTo(item.route);
  }
  console.log('Navigate to:', item.route || item.key);
};

const logout = async () => {
  sessionStorage.removeItem('jwt');
  sessionStorage.removeItem('paseto');
  sessionStorage.removeItem('CUUID');
  navigateTo('/login');
};

// State
const isDarkMode = ref(false)
const selectedFriend = ref<Friend | null>(null)
const newMessage = ref('')
const searchQuery = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const callActive = ref(false)

// Composable
const peerConnection = usePeerConnection()
const peer = ref<Peer | null>(null)
const currentPeerId = ref('')
const connections = ref<Record<string, DataConnection>>({})

const initPeer = async (options: PeerConnectionOptions) => {
  try {
    const result = await (await peerConnection).init(options)
    if (result) {
      peer.value = result
      currentPeerId.value = result.id
      connections.value = result.connections as Record<string, DataConnection>
    }
  } catch (error) {
    console.error('Failed to initialize peer connection:', error)
  }
}

const messageComposable = useMessage()

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
const friends = ref<Friend[]>(
  [
  // {
  //   id: 1,
  //   name: 'Teresa Lai',
  //   avatar: 'https://i.pravatar.cc/150?img=1',
  //   online: true,
  //   lastMessage: 'Best birthday spa retreat ever!',
  //   time: '1:41 PM'
  // },
  // {
  //   id: 2,
  //   name: 'Rendy Del Rosario',
  //   avatar: 'https://i.pravatar.cc/150?img=2',
  //   online: true,
  //   lastMessage: 'At what time are we going to the movies?',
  //   time: '5:10 PM'
  // },
  // {
  //   id: 3,
  //   name: 'TechEnthusiast',
  //   avatar: 'https://i.pravatar.cc/150?img=3',
  //   online: true,
  //   lastMessage: 'Check out this new tech!',
  //   time: 'just now'
  // },
  // {
  //   id: 4,
  //   name: 'ArtisticSoul',
  //   avatar: 'https://i.pravatar.cc/150?img=4',
  //   online: false,
  //   lastMessage: 'Thanks for the feedback!',
  //   time: '2:30 PM'
  // },
  // {
  //   id: 5,
  //   name: 'TravelBug',
  //   avatar: 'https://i.pravatar.cc/150?img=5',
  //   online: true,
  //   lastMessage: 'The view here is amazing!',
  //   time: '3:45 PM'
  // },
  // {
  //   id: 6,
  //   name: 'FoodLover',
  //   avatar: 'https://i.pravatar.cc/150?img=6',
  //   online: false,
  //   lastMessage: 'Let\'s try that new restaurant!',
  //   time: 'Yesterday'
  // },
  // {
  //   id: 7,
  //   name: 'Ming Lee',
  //   avatar: 'https://i.pravatar.cc/150?img=7',
  //   online: false,
  //   lastMessage: 'Meeting tomorrow at 10?',
  //   time: 'Yesterday'
  // },
  // {
  //   id: 8,
  //   name: 'John Smith',
  //   avatar: 'https://i.pravatar.cc/150?img=8',
  //   online: false,
  //   lastMessage: 'Thanks for your help!',
  //   time: '2 days ago'
  // }
]
)

const messages = ref<Message[]>([])

// Mock messages for different conversations
const mockConversations: Conversations = {
//   1: [ // Teresa's messages
//     {
//       sender: 'other',
//       content: 'Best birthday spa retreat ever, amirite?!! My face is glowing',
//       time: '9:41 AM'
//     },
//     {
//       sender: 'me',
//       content: 'My face too. Thanks again for everything. You are the best!',
//       time: '9:42 AM'
//     },
//     {
//       sender: 'other',
//       content: 'Anytime. Let me know if you want to link up again!',
//       time: '1:41 PM'
//     },
//     {
//       sender: 'me',
//       content: 'Lets def go again. Best spa in the city!',
//       time: '1:42 PM'
//     }
//   ],
//   2: [ // Rendy's messages
//     {
//       sender: 'other',
//       content: 'Hey',
//       time: '5:09 PM'
//     },
//     {
//       sender: 'other',
//       content: 'At what time are we going to the movies?',
//       time: '5:10 PM'
//     },
//     {
//       sender: 'me',
//       content: '8PM I think ...',
//       time: '5:34 PM'
//     },
//     {
//       sender: 'other',
//       content: 'Testing visual challenge',
//       time: '5:35 PM'
//     },
//     {
//       sender: 'me',
//       content: 'Cool :)',
//       time: '5:35 PM'
//     }
//   ],
//   3: [ // TechEnthusiast's messages
//     {
//       sender: 'other',
//       content: 'Hi',
//       time: '4:30 PM'
//     },
//     {
//       sender: 'me',
//       content: 'Who are you?🤔',
//       time: '4:35 PM'
//     }
//   ]
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

// Image handling
const openImageModal = (img: string) => {
  // TODO: Implement image modal
  console.log('Opening image:', img)
}

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  
  const files = Array.from(input.files)
  const images: string[] = []
  
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      images.push(e.target?.result as string)
      if (images.length === files.length) {
        sendMessageWithImages(images)
      }
    }
    reader.readAsDataURL(file)
  })
}

const sendMessageWithImages = (images: string[]) => {
  if (!selectedFriend.value) return
  
  const time = new Date().toLocaleTimeString()
  const message = {
    sender: 'me' as const,
    content: 'Sent images',
    time,
    images
  }

  messages.value.push(message)
  scrollToBottom()

  // Send via PeerJS if online
  if (selectedFriend.value.online && selectedFriend.value.peerId) {
    const conn = connections.value[selectedFriend.value.peerId]
    if (conn) {
      conn.send(JSON.stringify(message))
    }
  }
}

// Call functionality
const startCall = (isVideo: boolean) => {
  if (!selectedFriend.value?.peerId) return

  const time = new Date().toLocaleTimeString()
  const callMessage = {
    sender: 'me' as const,
    content: isVideo ? 'Video call request' : 'Voice call request',
    time,
    isCall: true
  }

  messages.value.push(callMessage)
  scrollToBottom()

  // Send call request
  if (selectedFriend.value.online && selectedFriend.value.peerId) {
    const conn = connections.value[selectedFriend.value.peerId]
    if (conn) {
      conn.send(JSON.stringify(callMessage))
    }
  }
}

const acceptCall = (message: Message) => {
  message.callAccepted = true
  // TODO: Implement call acceptance logic
  console.log('Call accepted, starting call...')
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

// Initialize peer connection
const initializePeer = async () => {
  const jwt = sessionStorage.getItem('jwt')
  const paseto = sessionStorage.getItem('paseto')
  const CUUID = sessionStorage.getItem('CUUID')
  
  if (!jwt || !paseto || !CUUID) {
    console.error('Missing authentication tokens')
    return
  }

  try {
    await initPeer({ jwt, paseto, CUUID })
  } catch (error) {
    console.error('Failed to initialize peer connection:', error)
  }
}

// Lifecycle hooks
onMounted(() => {
  initTheme()
  initializePeer()
})
</script>

<style scoped>
/* 確保固定定位的按鈕始終顯示在視窗右下角 */
.fixed {
  position: fixed;
  z-index: 50; /* Ensure it's above other content but below modals/sidebar if needed */
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