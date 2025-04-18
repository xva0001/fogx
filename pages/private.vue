<template>
  <div class="min-h-screen relative" :class="isDark ? 'bg-dark-900' : 'bg-gray-50'">
    <!-- Sidebar -->
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRoute" @item-click="handleNavigate" />

    <!-- Main Content Area -->
    <div class="transition-all duration-500" :style="{
      marginLeft: sidebarExpanded ? '16rem' : '4rem'
    }">
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <!-- Header Actions (与main.vue相同) -->
        <div class="flex items-center justify-between mb-8 p-4 rounded-xl" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <!-- Search Area -->
          <div class="search-container group flex-1 max-w-xl">
            <div class="relative flex items-center">
              <input type="text" placeholder="Search..."
                class="w-full px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
                :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
              <div v-if="isLoading" class="absolute right-3 animate-spin text-primary">
                <Loader2 class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-6 ml-4">
            <button class="btn btn-ghost btn-circle">
              <Bell class="h-5 w-5" />
            </button>
            <!-- 主題切換按鈕 -->
            <button class="btn btn-ghost btn-circle" @click="toggleTheme">
              <component :is="isDark ? Sun : Moon" class="h-5 w-5" />
            </button>
            <div class="divider divider-horizontal"></div>
            <!-- User Actions -->
            <div class="flex items-center space-x-3" @click.prevent="goAccoutManagement">
              <span class="text-sm">{{ user.username }}</span>
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                <img :src="user.icon" alt="" class="w-full h-full object-cover">
              </div>
            </div>
          </div>
        </div>

        <!-- Search Private Content Section -->
        <div class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-800'">Access Private Content</h2>
          
          <!-- Search Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Content Type</label>
              <div class="flex space-x-4">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" v-model="searchParams.type" value="story" class="radio radio-primary">
                  <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">Story</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" v-model="searchParams.type" value="post" class="radio radio-primary">
                  <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">Post</span>
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Content ID</label>
              <input v-model="searchParams.id" type="text" placeholder="Enter content ID"
                class="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Password</label>
              <input v-model="searchParams.password" type="password" placeholder="Enter password"
                class="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'">
            </div>
            
            <button @click="accessPrivateContent" 
                class="w-full py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition duration-200"
                :disabled="isLoading || !isFormValid">
              <Loader2 v-if="isLoading" class="inline w-4 h-4 mr-2 animate-spin" />
              {{ isLoading ? 'Loading...' : 'Access Content' }}
            </button>
          </div>
        </div>

        <!-- Create Private Content Section -->
        <div class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-800'">Create Private Content</h2>
          
          <div class="flex space-x-4">
            <button @click="openCreatePrivateStory" 
                class="flex-1 p-3 rounded-full text-white font-medium bg-blue-500 hover:bg-blue-600 transition duration-200">
              <PlusIcon class="inline w-4 h-4 mr-1" />
              Create Private Story
            </button>
            
            <button @click="openCreatePrivatePost" 
                class="flex-1 p-3 rounded-full text-white font-medium bg-green-500 hover:bg-green-600 transition duration-200">
              <PlusIcon class="inline w-4 h-4 mr-1" />
              Create Private Post
            </button>
          </div>
        </div>

        <!-- Recently Accessed Content -->
        <div v-if="recentContent.length > 0" class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-800'">Recently Accessed</h2>
          
          <div class="space-y-4">
            <div v-for="(item, index) in recentContent" :key="index" 
                class="p-4 rounded-xl shadow-sm border cursor-pointer hover:bg-opacity-50 transition duration-200"
                :class="isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'"
                @click="accessSavedContent(item)">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
                    {{ item.type === 'story' ? 'Private Story' : 'Private Post' }}
                  </div>
                  <div class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    ID: {{ maskId(item.id) }}
                  </div>
                </div>
                <div class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ formatTimeAgo(item.lastAccessed) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Display Area -->
        <div v-if="currentContent" class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-gray-800'">
              {{ currentContent.type === 'story' ? 'Private Story' : 'Private Post' }}
            </h2>
            <button @click="closeCurrentContent" class="p-2 rounded-full hover:bg-opacity-20 transition duration-200"
                :class="isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Story Content -->
          <div v-if="currentContent.type === 'story'" class="relative rounded-xl overflow-hidden shadow-md">
            <img :src="currentContent.image" alt="Story" class="w-full h-96 object-cover">
            <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-4">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                  <img :src="currentContent.userImage" alt="User" class="w-full h-full object-cover">
                </div>
                <div class="text-white text-lg font-medium">{{ currentContent.username }}</div>
              </div>
              <div class="text-white text-sm opacity-80">{{ formatTimeAgo(currentContent.date) }}</div>
            </div>
          </div>
          
          <!-- Post Content -->
          <div v-else-if="currentContent.type === 'post'" class="space-y-4">
            <!-- Post Header -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full overflow-hidden">
                <img :src="currentContent.icon" alt="User" class="w-full h-full object-cover">
              </div>
              <div>
                <div class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ currentContent.username }}</div>
                <div class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ formatTimeAgo(currentContent.date) }}</div>
              </div>
            </div>
            
            <!-- Post Content -->
            <div class="bg-opacity-50 rounded-xl p-4" :class="isDark ? 'bg-dark-lighter' : 'bg-gray-50'">
              <h3 class="text-xl font-bold mb-2" :class="isDark ? 'text-white' : 'text-gray-900'">{{ currentContent.title }}</h3>
              <p :class="isDark ? 'text-gray-300' : 'text-gray-700'">{{ currentContent.content }}</p>
              
              <ImageBox v-if="currentContent.images && currentContent.images.length > 0" class="pt-4" :images="currentContent.images" />
              
              <!-- Tags -->
              <div v-if="currentContent.tags && currentContent.tags.length > 0" class="flex flex-wrap gap-2 mt-4">
                <span v-for="tag in currentContent.tags" :key="tag" class="px-3 py-1 rounded-full text-sm"
                  :class="isDark ? 'text-blue-400 bg-blue-900/30' : 'bg-blue-50 text-blue-600'">
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- Action Buttons for Posts -->
            <div class="flex items-center justify-between pt-4 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
              <div class="flex space-x-6">
                <button class="flex items-center space-x-2 text-gray-500 hover:text-pink-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Like</span>
                </button>
                <button class="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comment</span>
                </button>
              </div>
              <button class="rounded-full text-gray-500 hover:text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateModal 
      v-if="showCreatePrivateStory" 
      :is-open="showCreatePrivateStory" 
      type="story" 
      @close="showCreatePrivateStory = false"
      @submit="handlePrivateStorySubmit" />

    <CreateModal 
      v-if="showCreatePrivatePost" 
      :is-open="showCreatePrivatePost" 
      type="post" 
      @close="showCreatePrivatePost = false"
      @submit="handlePrivatePostSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Comment from '~/components/Comment.vue';
import StoryViewer from '~/components/StoryViewer.vue';
import CreateModal from '~/components/CreateModal.vue'; // 修改：使用CreateModal
import ShareModal from '~/components/ShareModal.vue';
import ImageBox from '~/components/ImageBox.vue';
import Sidebar from '~/components/Sidebar.vue';
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  Bookmark,
  Settings,
  User,
  LogOut,
  Plus as PlusIcon,
  Sun,
  Moon,
  X,
  Loader2
} from 'lucide-vue-next';
import type { MenuItem } from '~/composables/IMenu';
import type { IStory } from '~/composables/Istory';

import RequestEncryption from '~/shared/Request/requestEncrytion';
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
import type { EncryptedRes } from '~/shared/Request/IEncryptRes';
import type { EncryptReq } from '~/shared/Request/IEncryptReq';
import Identicon from 'identicon.js';
import { sha3_256 } from 'js-sha3';

// 添加缺失的接口定义
interface UserPost {
  id: number | string;
  icon: string;
  username: string;
  userID: string;
  date: Date | string;
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  likes: number;
  commentCount: number;
  isLiked: boolean;
  showComments?: boolean;
  newComment?: string;
  comments: any[];
}

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const sidebarExpanded = ref(false);
const currentRoute = ref('private');

// 私人内容相关的状态
const searchParams = ref({
  type: 'story',
  id: '',
  password: ''
});

// 私有内容模态框状态
const showCreatePrivateStory = ref(false);
const showCreatePrivatePost = ref(false);

// 添加变量，以防被引用
const selectedStoryIndex = ref<number | null>(null);
const shareModalPost = ref<UserPost | null>(null);

// 最近访问内容的存储
interface RecentContentItem {
  id: string;
  type: 'story' | 'post';
  password: string;
  lastAccessed: Date;
}
const recentContent = ref<RecentContentItem[]>([]);

// 当前内容显示
const currentContent = ref<any>(null);

// 表单验证计算属性
const isFormValid = computed(() => {
  return searchParams.value.id.trim() !== '' && searchParams.value.password.trim() !== '';
});

// User data
const user = ref({ icon: '', username: 'User', email: '', twoFactorEnabled: true });

// Navigation items
const navigationItems = computed<MenuItem[]>(() => [
  {
    key: 'home',
    icon: Home,
    label: 'Home',
    route: '/'
  },
  {
    key: 'explore',
    icon: Search,
    label: 'Explore',
    route: '/explore'
  },
  {
    key: 'messages',
    icon: MessageCircle,
    label: 'Messages',
    route: '/messages'
  },
  {
    key: 'notifications',
    icon: Bell,
    label: 'Notifications',
    route: '/notifications'
  },
  {
    key: 'bookmarks',
    icon: Bookmark,
    label: 'Bookmarks',
    route: '/bookmarks'
  },
  {
    key: 'private',
    icon: Search,
    label: 'Private Content',
    route: '/Private'
  }
]);

const bottomItems = computed<MenuItem[]>(() => [
  {
    key: 'settings',
    icon: Settings,
    label: 'Settings',
    route: '/settings'
  },
  {
    key: 'profile',
    icon: User,
    label: 'Profile',
    route: '/profile'
  },
  {
    key: 'logout',
    icon: LogOut,
    label: 'Logout'
  }
]);

// 常见变量
const isLoading = ref(false);
const error = ref<string | null>(null);
const stories = ref<IStory[]>([]);
const displayedPosts = ref<any[]>([]);

// Event handlers
const handleNavigate = (item: MenuItem) => {
  if (item.key === 'logout') {
    logout();
  }
  currentRoute.value = item.key;
  if (item.route) {
    navigateTo(item.route);
  }
};

const goAccoutManagement = () => {
  navigateTo({ path: "/AccountManagement" });
};

const toggleTheme = () => {
  if (import.meta.client) {
    isDark.value = !isDark.value;
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light';
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  }
};

const openCreatePrivateStory = () => {
  showCreatePrivateStory.value = true;
};

const openCreatePrivatePost = () => {
  showCreatePrivatePost.value = true;
};

const logout = async () => {
  sessionStorage.removeItem('jwt');
  sessionStorage.removeItem('paseto');
  sessionStorage.removeItem('CUUID');
  navigateTo('/login');
};

// ID掩码函数
const maskId = (id: string): string => {
  if (id.length <= 8) return id;
  return id.substring(0, 4) + '...' + id.substring(id.length - 4);
};

// Format time ago function
const formatTimeAgo = (dateInput: Date | string) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('jwt');
  if (!token) {
    console.warn('Authentication token not found.');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Fetch user data
const fetchUserData = async () => {
  let shared: string | undefined;
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem('CUUID');
    if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");

    const packet = { jwt, paseto, CUUID };
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared);

    const requestBody: EncryptReq = { ...encryptedCoreData, pubkey: pair.getPublic("hex") };

    const response_enc = await $fetch<EncryptedRes>('/api/user/profileget', {
      method: "POST", headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(requestBody)
    });

    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) throw new Error("Invalid response structure from profileget");
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    const response = JSON.parse(decryptedJsonString);

    if (response.success && response.user) {
      if (!response.user.icon) {
        response.user.icon = "data:image/png;base64," + new Identicon(sha3_256(response.user.username || CUUID), 128).toString();
      } else if (!response.user.icon.startsWith('data:image')) {
         response.user.icon = "data:image/png;base64," + response.user.icon;
      }
      Object.assign(user.value, response.user);
      console.log("User data fetched:", user.value);
    } else { 
      throw new Error(response?.message || 'Failed to fetch user data'); 
    }
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    if (error.statusCode === 401) {
      navigateTo('/login');
    }
  }
};

// 图像类型检测和格式化函数
const detectImageType = (base64String: string): string | null => {
  try {
    const cleanedBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    const byteString = atob(cleanedBase64.substring(0, 100));
    
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'jpeg';
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'png';
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'gif';
    } else if ((bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) &&
               (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)) {
      return 'webp';
    }
    
    return 'jpeg';
  } catch (e) {
    console.error('Error detecting image type:', e);
    return null;
  }
};

const sanitizeImageData = (imageData: string): string => {
  if (!imageData) return '';
  
  if (!imageData.startsWith('data:image/')) {
    const imageType = detectImageType(imageData) || 'jpeg';
    return `data:image/${imageType};base64,${imageData.replace(/^data:image\/\w+;base64,/, '')}`;
  }
  
  return imageData;
};

// 本地存储相关的函数
const loadRecentContent = () => {
  if (process.client) {
    const savedContent = localStorage.getItem('recentPrivateContent');
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        recentContent.value = parsed.map((item: any) => ({
          ...item,
          lastAccessed: new Date(item.lastAccessed)
        }));
      } catch (e) {
        console.error('Failed to parse recent content from localStorage:', e);
        recentContent.value = [];
      }
    }
  }
};

const saveRecentContent = () => {
  if (process.client) {
    const limitedRecent = [...recentContent.value]
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 5);
    
    localStorage.setItem('recentPrivateContent', JSON.stringify(limitedRecent));
  }
};

const addToRecentContent = (item: RecentContentItem) => {
  const existingIndex = recentContent.value.findIndex(i => i.id === item.id && i.type === item.type);
  if (existingIndex !== -1) {
    recentContent.value.splice(existingIndex, 1);
  }
  
  recentContent.value.unshift(item);
  saveRecentContent();
};

// 访问私人内容的函数
const accessPrivateContent = async () => {
  if (!isFormValid.value || isLoading.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    if (!jwt || !paseto) {
      navigateTo('/login');
      return;
    }
    
    const contentType = searchParams.value.type;
    const contentId = searchParams.value.id;
    const password = searchParams.value.password;
    
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }
    
    const pair = genKeyCurve25519();
    const clientPubKey = pair.getPublic("hex");
    const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    
    const payload = {
      jwt,
      paseto,
      contentId,
      password
    };
    
    const encryptedData = await RequestEncryption.encryptMessage(
      JSON.stringify(payload),
      shared
    );
    
    const requestBody = {
      iv: encryptedData.iv,
      encryptedMessage: encryptedData.encryptedMessage,
      pubkey: clientPubKey
    };
    
    const apiEndpoint = contentType === 'story' 
      ? '/api/stories/getPrivate' 
      : '/api/post/getPrivatePost';
    
    const response = await $fetch<EncryptedRes>(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody)
    });
    
    if (!response || !response.encryptedMessage || !response.iv) {
      throw new Error(`Invalid response from ${apiEndpoint}`);
    }
    
    const decryptedResponse = await RequestEncryption.decryptMessage(
      response.encryptedMessage,
      shared,
      response.iv
    );
    
    const parsedResponse = JSON.parse(decryptedResponse);
    
    if (!parsedResponse.success) {
      throw new Error(parsedResponse.message || 'Failed to access private content');
    }
    
    if (contentType === 'story') {
      const story = parsedResponse.story;
      if (story.userImage == story.username) {
        story.userImage = new Identicon(sha3_256(story.username), 100).toString();
      }
      story.userImage = "data:image/png;base64," + story.userImage;
      
      currentContent.value = {
        type: 'story',
        id: story.id,
        username: story.username,
        image: story.image,
        userImage: story.userImage,
        date: new Date(story.date || Date.now())
      };
    } else {
      const post = parsedResponse.post;
      if (!post.icon) {
        post.icon = "data:image/png;base64," + new Identicon(sha3_256(post.username || post.userID), 100).toString();
      } else if (!post.icon.startsWith('data:image')) {
        post.icon = "data:image/png;base64," + post.icon;
      }
      
      currentContent.value = {
        type: 'post',
        id: post.id,
        username: post.username,
        userID: post.userID,
        icon: post.icon,
        title: post.title,
        content: post.content,
        images: post.images || [],
        tags: post.tags || [],
        date: new Date(post.date || Date.now())
      };
    }
    
    addToRecentContent({
      id: contentId,
      type: contentType as 'story' | 'post',
      password: password,
      lastAccessed: new Date()
    });
    
    searchParams.value.id = '';
    searchParams.value.password = '';
    
  } catch (err: any) {
    console.error('Error accessing private content:', err);
    error.value = err.message || 'Failed to access content';
    alert(`Error: ${error.value}`);
  } finally {
    isLoading.value = false;
  }
};

// 访问保存内容的函数
const accessSavedContent = (item: RecentContentItem) => {
  searchParams.value.type = item.type;
  searchParams.value.id = item.id;
  searchParams.value.password = item.password;
  
  item.lastAccessed = new Date();
  saveRecentContent();
  
  accessPrivateContent();
};

// 关闭当前内容的函数
const closeCurrentContent = () => {
  currentContent.value = null;
};

// 创建私人故事的函数
const handlePrivateStorySubmit = async (storyInputData: any) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    if (!jwt || !paseto) {
      navigateTo('/login');
      return;
    }
    
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }
    
    const pair = genKeyCurve25519();
    const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    const fixedIV = RequestEncryption.getRandIV()
    const storyData = {
      jwt,
      paseto,
      image: await RequestEncryption.encryptMessageWithFixIV(storyInputData.image,storyInputData.password,fixedIV),
      isPublic: false,
      iv:fixedIV,
      requestTime: new Date().toISOString()
    };
    

    let encrypt: any = await RequestEncryption.encryptMessage(
      JSON.stringify(storyData),
      shared
    );
    encrypt["pubkey"] = pair.getPublic("hex");
    
    const response = await $fetch<EncryptedRes>('/api/stories/addPrivate', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    });
    
    const decryptedResponse = await RequestEncryption.decryptMessage(
      response.encryptedMessage,
      shared,
      response.iv
    );
    
    const parsedResponse = JSON.parse(decryptedResponse);
    
    if (!parsedResponse.success) {
      throw new Error(parsedResponse.message || 'Failed to create private story');
    }
    
    alert(`Private story created successfully!\nID: ${parsedResponse.id}\nPlease save this ID to access your story later.`);
    
    addToRecentContent({
      id: parsedResponse.id,
      type: 'story',
      password: storyInputData.password,
      lastAccessed: new Date()
    });
    
    showCreatePrivateStory.value = false;
    
  } catch (err: any) {
    console.error('Error creating private story:', err);
    error.value = err.message || 'Failed to create private story';
    alert(`Error: ${error.value}`);
  } finally {
    isLoading.value = false;
  }
};

// 创建私人帖子的函数
const handlePrivatePostSubmit = async (postInputData: any) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    if (!jwt || !paseto) {
      navigateTo('/login');
      return;
    }
    
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }
    
    const pair = genKeyCurve25519();
    const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    
    let imageData = null;
    if (postInputData.image) {
      imageData = typeof postInputData.image === 'string'
        ? postInputData.image
        : (postInputData.image.base64 || null);
      
      if (imageData) {
        imageData = sanitizeImageData(imageData);
      }
    }
    
    if (!postInputData.title || postInputData.title.length < 4 || postInputData.title.length > 40) {
      throw new Error("Title must be between 4 and 40 characters");
    }
    
    if (!postInputData.content || postInputData.content.length < 4 || postInputData.content.length > 1000) {
      throw new Error("Content must be between 4 and 1000 characters");
    }

    const fixedIV = RequestEncryption.getRandIV()

    
    const postData = {
      jwt,
      paseto,
      isPublic: false,
      title: (await RequestEncryption.encryptMessageWithFixIV(postInputData.title,sha3_256(postInputData.password),fixedIV)).encryptedMessage,
      content: (await RequestEncryption.encryptMessageWithFixIV(postInputData.content,sha3_256(postInputData.password),fixedIV)).encryptedMessage,
      Image: (await RequestEncryption.encryptMessageWithFixIV(JSON.stringify(imageData ? [imageData] : []),sha3_256(postInputData.password),fixedIV)).encryptedMessage,
      tags: postInputData.tags || [],
      requestTime: new Date().toISOString()
    };
    
    let encrypt: any = await RequestEncryption.encryptMessage(
      JSON.stringify(postData),
      shared
    );
    encrypt["pubkey"] = pair.getPublic("hex");
    
    const response = await $fetch<EncryptedRes>('/api/post/createPrivatePost', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    });
    
    const decryptedResponse = await RequestEncryption.decryptMessage(
      response.encryptedMessage,
      shared,
      response.iv
    );
    
    const parsedResponse = JSON.parse(decryptedResponse);
    
    if (!parsedResponse.success && !parsedResponse.id) {
      throw new Error(parsedResponse.message || 'Failed to create private post');
    }
    
    alert(`Private post created successfully!\nID: ${parsedResponse.id}\nPlease save this ID to access your post later.`);
    
    addToRecentContent({
      id: parsedResponse.id,
      type: 'post',
      password: postInputData.password,
      lastAccessed: new Date()
    });
    
    showCreatePrivatePost.value = false;
    
  } catch (err: any) {
    console.error('Error creating private post:', err);
    error.value = err.message || 'Failed to create private post';
    alert(`Error: ${error.value}`);
  } finally {
    isLoading.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化主题
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    isDark.value = savedTheme === 'dark';
    document.documentElement.dataset.theme = savedTheme;
  }
  
  // 获取用户数据
  fetchUserData();
  
  // 从localStorage加载最近访问的内容
  loadRecentContent();
});
</script>

<style scoped>
/* 添加暗色模式的背景色變量 */
:root {
  --dark-900: #1a1a1a;
  --dark-800: #2d2d2d;
  --dark-lighter: #343434;
}

.bg-dark-900 {
  background-color: var(--dark-900);
}

.bg-dark-800 {
  background-color: var(--dark-800);
}

.bg-dark-lighter {
  background-color: var(--dark-lighter);
}

/* 增強卡片陰影效果 */
.shadow-sm {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
}

/* 暗色模式下的陰影 */
:is(.dark .shadow-sm) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 平滑過渡 */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* 添加主題切換過渡效果 */
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>