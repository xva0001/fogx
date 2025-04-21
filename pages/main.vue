<template>
  <div class="min-h-screen relative" :class="isDark ? 'bg-dark-900' : 'bg-gray-50'">
    <!-- Sidebar -->
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRouteKey" @item-click="handleNavigate" />

    <!-- Main Content Area -->
    <div class="transition-all duration-500" :style="{
      marginLeft: sidebarExpanded ? '16rem' : '4rem'
    }">
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <!-- Header Actions (Moved from Top Navigation Bar) -->
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
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center  overflow-hidden">
                <!-- <span class="text-white font-bold">{{ user.icon }}</span> -->
                <img :src="user.icon" alt="" class="w-full h-full object-cover">
              </div>
            </div>
          </div>
        </div>

        <!-- Rest of the content remains the same -->
        <!-- Stories Section -->
        <div class="rounded-xl p-4" :class="isDark ? 'bg-dark-800' : 'bg-white'"> <!-- 添加背景和padding -->
          <div class="overflow-x-auto">
            <div class="flex space-x-4 pb-4">
              <!-- Add Story Card -->
              <div class="flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden relative shadow-sm cursor-pointer group"
                :class="isDark ? 'bg-dark-lighter' : 'bg-white'" @click="openCreateStory">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <div
                  class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center absolute top-4 left-1/2 transform -translate-x-1/2">
                  <PlusIcon class="w-6 h-6 text-white" />
                </div>
                <span class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm font-medium">
                  Create Story
                </span>
              </div>

              <!-- Story Items -->
              <div v-for="(story, index) in stories" :key="story.id"
                class="flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden relative shadow-sm cursor-pointer"
                @click="openStory(index)">
                <img :src="story.image" class="w-full h-full object-cover" :alt="story.username">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div class="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
                    <!--  --><img :src="story.userImage" alt="" class="w-full h-full object-cover">
                  </div>
                </div>
                <span class="absolute bottom-4 left-4 text-white text-sm font-medium">
                  {{ story.username }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Post Section -->
        <div class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'"> <!-- 增加 padding -->
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center  overflow-hidden">
              <img :src="user.icon" alt="" class="w-full h-full object-cover">
            </div>
            <input v-model="newPostContent"
              class="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
              :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'"
              :placeholder="postPlaceholder" @focus="openCreatePost" />
          </div>
        </div>

        <!-- Posts Feed -->
        <div class="space-y-6">
          <div v-for="post in displayedPosts" :key="post.id" class="rounded-xl shadow-sm p-6"
            :class="isDark ? 'bg-dark-800' : 'bg-white'">
            <div class="p-4">
              <!-- Post Header -->
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                  <img v-if="post.icon && post.icon.startsWith('data:image')"
                      :src="post.icon"
                      :alt="`${post.username}'s avatar`"
                      class="w-full h-full object-cover">
                  <span v-else class="text-gray-500 dark:text-gray-400 font-bold">
                    {{ post.username ? post.username.charAt(0).toUpperCase() : '?' }}
                  </span>
                </div>
                <div>
                  <div class="font-semibold">{{ post.username }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatTimeAgo(post.date) }}</div>
                </div>
              </div>


              <!-- Post Content -->
              <h1 class="text-xl font-bold mb-4">{{ post.title }}</h1>
              <div class="space-y-2" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                <p>{{ post.content }}</p>
                <ImageBox v-if="post.images" class="pt-2" :images="post.images" />
              </div>

              <!-- Tags -->
              <div class="flex flex-wrap gap-2 mt-4">
                <span v-for="tag in post.tags" :key="tag" class="px-3 py-1 rounded-full text-sm"
                  :class="isDark ? 'text-blue-400 bg-blue-900/30' : 'bg-blue-50 text-blue-600'">
                  #{{ tag }}
                </span>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-800">
                <div class="flex space-x-6">
                  <button @click="toggleLike(post)" class="flex items-center space-x-2"
                    :class="post.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'">
                    <Icon :name="post.isLiked ? 'bi:balloon-heart-fill' : 'bi:balloon-heart'" class="h-5 w-5" />
                    <span>{{ post.likes }}</span>
                  </button>
                  <button @click="toggleComments(post)" class="flex items-center space-x-2"
                    :class="post.showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'">
                    <Icon name="bi:chat-left-dots" class="w-5 h-5" />
                    <span>{{ post.commentCount }}</span>
                  </button>
                </div>
                <button @click="sharePost(post)" class="rounded-full text-gray-500 hover:text-green-500">
                  <Icon name="bi:share" class="h-5 w-5" />
                </button>
              </div>

              <!-- Comments Section -->
              <div v-if="post.showComments" class="mt-4 pt-4 border-t dark:border-gray-800">
                <!-- Add Comment -->
                <div class="flex items-center space-x-3 mb-4">
                  <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span class="text-sm text-white font-bold">{{ currentUser.icon }}</span>
                  </div>
                  <div class="flex-1 relative">
                    <input v-model="post.newComment" @keyup.enter="addComment(post)" type="text"
                      placeholder="Add a comment..."
                      class="w-full px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>
                  <button @click="addComment(post)" class="px-4 py-2 text-blue-500 font-semibold disabled:opacity-50"
                    :disabled="!post.newComment?.trim()">
                    Post
                  </button>
                </div>

                <!-- Comments List -->
                <div class="space-y-4">
                  <div v-for="comment in post.comments" :key="comment.id" class="relative">
                    <div v-if="!comment.isEditing">
                      <Comment :icon="comment.icon" :username="comment.username" :userID="comment.userID"
                      :date="new Date(comment.date)" :content="comment.content" />
                      <!-- Comment Actions -->
                      <div v-if="comment.userID === currentUser.userID" class="absolute top-4 right-4 flex space-x-2">
                        <button @click="startEdit(comment)"
                          class="px-3 py-1 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600">
                          Edit
                        </button>
                        <button @click="deleteComment(post, comment)"
                          class="px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600">
                          Delete
                        </button>
                      </div>
                    </div>

                    <!-- Edit Mode -->
                    <div v-else class="bg-gray-50 dark:bg-dark-lighter rounded-xl p-4">
                      <textarea v-model="comment.editContent"
                        class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500 min-h-[100px]"
                        :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'"></textarea>
                      <div class="flex justify-end space-x-2 mt-2">
                        <button @click="cancelEdit(comment)"
                          class="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-800">
                          Cancel
                        </button>
                        <button @click="updateComment(post, comment)"
                          class="px-4 py-2 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600"
                          :disabled="!comment.editContent?.trim()">
                          {{ comment.editContent ? 'Save' : 'Cannot Save Empty' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-center items-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>

          <!-- Intersection Observer Target -->
          <div ref="infiniteScrollTrigger" class="h-4 w-full"></div>

          <!-- Error Message -->
          <div v-if="error" class="text-center py-4 text-red-500">
            {{ error }}
            <button @click="retryLoading" class="text-blue-500 hover:underline ml-2">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <StoryViewer v-if="selectedStoryIndex !== null" 
      :is-open="selectedStoryIndex !== null" 
      :stories="stories"
      :initial-index="selectedStoryIndex" 
      :current-username="user.username"
      @close="closeStory" 
      @delete="deleteStory" />

    <CreateModal v-if="showCreateStory" :is-open="showCreateStory" type="story" @close="showCreateStory = false"
      @submit="handleStorySubmit" />

    <CreateModal v-if="showCreatePost" :is-open="showCreatePost" type="post" @close="showCreatePost = false"
      @submit="handlePostSubmit" />

    <ShareModal v-if="shareModalPost" :is-open="!!shareModalPost" :post="shareModalPost"
      @close="shareModalPost = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Comment from '~/components/Comment.vue';
import StoryViewer from '~/components/StoryViewer.vue';
import CreateModal from '~/components/CreateModal.vue';
import ShareModal from '~/components/ShareModal.vue';

import ImageBox from '~/components/ImageBox.vue';
import Sidebar from '~/components/Sidebar.vue';
import DarkModeBtn from '~/components/DarkModeBtn.vue';
import {
  Bell,
  Plus as PlusIcon,
  Sun,
  Moon,
  Loader2
} from 'lucide-vue-next'

import type { IStory } from '~/composables/Istory';
import RequestEncryption from '~/shared/Request/requestEncrytion';
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
import type { EncryptedRes } from '~/shared/Request/IEncryptRes';
import type { EncryptReq } from '~/shared/Request/IEncryptReq';
import type { FetchOptions } from 'ofetch';
import Identicon from 'identicon.js';
import { sha3_256 } from 'js-sha3';

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

import { useNavigation } from '~/composables/useNavigation';

const {
  sidebarExpanded,
  currentRouteKey,
  navigationItems,
  bottomItems,
  handleNavigate,
  setActiveRoute
} = useNavigation();

const goAccoutManagement = () => {
  navigateTo({ path: "/AccountManagement" })
}

const toggleTheme = () => {
  if (process.client) {
    isDark.value = !isDark.value
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }
}

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
    const requestBody: EncryptReq = { iv: encryptedCoreData.iv, encryptedMessage: encryptedCoreData.encryptedMessage, pubkey: pair.getPublic("hex") };

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
    // If it's authentication issue, redirect to login page
    if (error.statusCode === 401) {
      navigateTo('/login');
    }
  }
};



onMounted(() => {

  setActiveRoute('home');

  // 1. 初始化主題
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    isDark.value = savedTheme === 'dark';
    document.documentElement.dataset.theme = savedTheme;
  }
  fetchUserData()

  // 2. 首次加載貼文
  fetchPosts(1);
  fetchStory()

  // 3. 設置無限滾動 (假設 setupInfiniteScroll 返回 observer)
  const observer = setupInfiniteScroll();

  // 4. 設置時間戳更新定時器 (例如，每秒更新一次 currentTimestamp)
  const timestampInterval = setInterval(() => {
    currentTimestamp.value = Date.now();
  }, 1000); // 每秒更新一次

  // 5. 在 onUnmounted 中統一清理
  onUnmounted(() => {
    // 清理無限滾動觀察者
    if (infiniteScrollTrigger.value && observer) { // 確保 observer 存在
      observer.unobserve(infiniteScrollTrigger.value);
    }
    // 清理時間戳定時器
    clearInterval(timestampInterval);
  });
});

interface UserPost {
  id: number | string;
  icon: string;
  username: string;
  userID: string;
  date: Date | string; // 確保這裡使用的是正確的 Date 對象
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  likes: number;
  commentCount: number;
  isLiked: boolean;
  showComments?: boolean;
  newComment?: string;
  comments: Comment[];
}

// Mock current user data
const currentUser = ref({
  icon: 'M',
  username: 'MyUser',
  userID: 'myuser123'
});

// Initial posts data with proper date objects
const initialPosts: UserPost[] = [
  {
    id: 1,
    icon: '🌟',
    username: 'TechEnthusiast',
    userID: 'tech_enthusiast',
    date: new Date(), // 確保這裡使用的是正確的 Date 對象
    title: 'Amazing Technology',
    content: 'Exploring the latest tech innovations!',
    images: [
      'https://picsum.photos/800/600',
      'https://picsum.photos/800/601',
      'https://picsum.photos/800/602'
    ],
    tags: ['technology', 'innovation', 'future'],
    likes: 156,
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  },
  {
    id: 2,
    icon: '🎨',
    username: 'ArtisticSoul',
    userID: 'artistic_soul',
    date: new Date('2024-01-16'),
    title: 'Creative Journey',
    content: 'Sharing my latest artwork with everyone!',
    images: ['https://picsum.photos/800/603'],
    tags: ['art', 'creativity', 'inspiration'],
    likes: 89,
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  }
];

// Infinite scroll related refs
const user = ref({ icon: '', username: 'User', email: '', twoFactorEnabled: true }); // Default username
const displayedPosts = ref<UserPost[]>([]); // Start empty, load from API
const isLoading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const error = ref<string | null>(null);
const infiniteScrollTrigger = ref<HTMLElement | null>(null);
const postPlaceholder = ref("What's on your mind?");
const selectedStoryIndex = ref<number | null>(null);
const newPostContent = ref('');
const showCreateStory = ref(false);
const showCreatePost = ref(false);
const shareModalPost = ref<UserPost | null>(null);
const currentTimestamp = ref(Date.now());

// Add stories data
const stories = ref<IStory[]>([
  // {
  //   id: 1,
  //   username: 'TechEnthusiast',
  //   userImage: 'https://picsum.photos/100/100?random=1',
  //   image: 'https://picsum.photos/400/600?random=1',
  // },
  // {
  //   id: 2,
  //   username: 'ArtisticSoul',
  //   userImage: 'https://picsum.photos/100/100?random=2',
  //   image: 'https://picsum.photos/400/600?random=2',
  // },
  // {
  //   id: 3,
  //   username: 'TravelBug',
  //   userImage: 'https://picsum.photos/100/100?random=3',
  //   image: 'https://picsum.photos/400/600?random=3',
  // },
  // {
  //   id: 4,
  //   username: 'FoodLover',
  //   userImage: 'https://picsum.photos/100/100?random=4',
  //   image: 'https://picsum.photos/400/600?random=4',
  // },
]);

const fetchStory =  async () => {
  //req

  const jwt = sessionStorage.getItem('jwt');
  const paseto = sessionStorage.getItem('paseto');

  if (!jwt || !paseto) {
    console.error('Authentication tokens not found');
    navigateTo('/login');
    return;
  }

  let shared: string
  try {
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }

    const pair = genKeyCurve25519()
    const clientPubKey = pair.getPublic("hex")
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"))

    let encrypted: any = await RequestEncryption.encryptMessage(JSON.stringify({ jwt: jwt, paseto: paseto }), shared)
    encrypted["pubkey"] = clientPubKey

    const req_forStory = await $fetch("/api/stories/userStoriesGet", {
      method: "POST",
      body: JSON.stringify(encrypted)
    }).then((res: any) => RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv))

    let arrIStory: IStory[] = JSON.parse(req_forStory)

    for (let index = 0; index < arrIStory.length; index++) {
      const element = arrIStory[index];
       //throw new Error("Testing")
    /**
     * if (response.user.icon == null) {
        //response.user.username
        response.user.icon = new Identicon(sha3_256(response.user.username), 100).toString()
        //data:image/png;base64,

      }
      response.user.icon = "data:image/png;base64," + response.user.icon
     */

     if (element.userImage == element.username) {
      element.userImage = new Identicon(sha3_256(element.username), 100).toString()
     }
      element.userImage = "data:image/png;base64,"+element.userImage

      stories.value.unshift(element)
    }

  } catch (e){
    console.log(e);
    
    console.log("story get error");

  }

}

// Function to handle create post
const openCreatePost = () => {
  showCreatePost.value = true;
};

// Toggle like on a post

const toggleLike = async (post: UserPost) => {
  const originalLiked = post.isLiked;
  const originalLikes = post.likes ?? 0;

  // 樂觀更新 UI
  post.isLiked = !post.isLiked;
  post.likes = originalLikes + (post.isLiked ? 1 : -1);

  let shared: string | undefined;

  console.log("Toggling like for post:", post.id, typeof post.id);
  const apiUrl = `/api/post/${post.id}/like`;
  console.log("Calling like API:", apiUrl);
  
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem('CUUID');
    if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");

    // --- 加密流程 ---
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    
    // 在新結構中，只需要傳遞認證信息和操作類型（可選）
    const payload = { 
      jwt, 
      paseto, 
      CUUID,
      action: post.isLiked ? 'like' : 'unlike' // 可選：明確告訴後端是點讚還是取消
    };
    
    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
    const requestBody: EncryptReq = {
      iv: encryptedCoreData.iv,
      encryptedMessage: encryptedCoreData.encryptedMessage,
      pubkey: pair.getPublic("hex")
    };
    // --- 加密流程結束 ---

    const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody)
    });

    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) throw new Error("Invalid response from like API.");
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    const response = JSON.parse(decryptedJsonString) as { success: boolean; likes?: number; isLiked?: boolean; message?: string };
    
    if (response && response.success) {
      // 使用伺服器返回的最終狀態更新 UI
      post.likes = response.likes ?? post.likes;
      post.isLiked = response.isLiked ?? post.isLiked;
      console.log(`Post ${post.id} like status updated by server.`);
    } else {
      throw new Error(response?.message || 'Failed to update like status');
    }
  } catch (err: any) {
    console.error(`Error toggling like for post ${post.id}:`, err);
    // 出錯時恢復原狀
    post.isLiked = originalLiked;
    post.likes = originalLikes;
    const message = err.data?.message || err.message || 'Unknown error';
    alert(`Failed to update like status: ${message}`);
  }
};

// Toggle comments visibility
const toggleComments = (post: UserPost) => { post.showComments = !post.showComments; };
const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('jwt'); // 或 paseto，取決於後端期望
  if (!token) {
    console.warn('Authentication token not found.');
    // 可以考慮導航到登入頁面
    // navigateTo('/login');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Enhanced comment interface
interface Comment {
  id: number | string;
  icon: string;
  username: string;
  userID: string;
  date: Date | string;
  content: string;
  isEditing?: boolean;
  editContent?: string;
}

type FetchMethod = "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";

async function fetchEncrypted<T = any>(
  url: string,
  options: RequestInit = {}, // 包含 method, headers 等
  payload?: any // 對於 POST/PUT，這是要加密的數據
): Promise<T> { // 返回解密後的業務數據
  console.log(`fetchEncrypted: ${options.method || 'GET'} ${url}`);
  let shared: string | undefined; // 將 shared 提升作用域以便 catch 中使用

  try {
    // 1. 獲取伺服器公鑰 (考慮緩存以提高效率)
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }

    // 2. 生成客戶端密鑰對
    const pair = genKeyCurve25519();
    const clientPubKey = pair.getPublic("hex");
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));

    // 3. 準備請求體 (如果需要加密 payload)
    let requestBodyForFetch: string | undefined;
    if (payload && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) { // DELETE 也可能需要加密 body
      console.log('Encrypting payload:', payload);
      const encryptedCoreData = await RequestEncryption.encryptMessage(
        JSON.stringify(payload),
        shared
      );
      const encryptedBodyObject: EncryptReq = { // 符合後端期望的結構
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage,
        pubkey: clientPubKey
      };
      requestBodyForFetch = JSON.stringify(encryptedBodyObject);
      console.log('Encrypted request body:', requestBodyForFetch);
    }

    // 4. 準備 $fetch 選項
    const baseFetchOptions = { // 先包含 method 之外的其他選項
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
      body: requestBodyForFetch,
      // 可以複製其他兼容選項
    };


    // 驗證並添加 method 屬性，確保其類型正確
    const upperCaseMethod = options.method?.toUpperCase();
    let finalMethod: FetchMethod | undefined = undefined;
    if (upperCaseMethod && ["GET", "HEAD", "PATCDH", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE"].includes(upperCaseMethod)) {
      // 將驗證過的、大寫的方法字符串斷言為 Nitro 期望的類型
      finalMethod = upperCaseMethod as FetchMethod; // <--- 關鍵修正
    }



    // 構造最終傳遞給 $fetch 的選項
    const finalFetchOptions = {
      ...baseFetchOptions,
      ...(finalMethod && { method: finalMethod }) // 只有當 method 有效時才添加 method 屬性
    };


    // 5. 發送請求
    console.log('Sending fetch request with options:', finalFetchOptions);
    const response_enc = await $fetch<EncryptedRes>(url, finalFetchOptions);
    console.log('Received encrypted response:', response_enc);


    // 6. 檢查基本回應結構
    if (!response_enc || typeof response_enc.encryptedMessage !== 'string' || typeof response_enc.iv !== 'string') {
      throw new Error('Invalid encrypted response structure from server.');
    }


    // 7. 解密回應
    const decryptedResponse = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    console.log('Decrypted response:', decryptedResponse);
    
    let result;
    try {
      result = JSON.parse(decryptedResponse);
    } catch (parseError) {
      console.error('Failed to parse server response:', parseError);
      console.error('Raw response:', decryptedResponse);
      throw new Error('Invalid server response format');
    }
    
    if (!result.success && result.message) {
      console.error('Server reported failure:', result);
      throw new Error(result.message || 'Failed to create post');
    }
    
    // Handle the case where success is undefined but we have ID
    if (result.id) {
      console.log('Post created successfully with ID:', result.id);
      // Success case - continue with refresh
    } else if (result.success === undefined) {
      // If success is undefined and we don't have an ID, treat as error
      console.error('Unknown server response format:', result);
      throw new Error('Invalid server response format - success flag and ID missing');
    }


    // 9. 返回解密後的業務數據 (可能是整個對象，或其中的 data 屬性，取決於後端)
    return result as T;

  } catch (error: any) {
    console.error(`Encrypted fetch to ${url} failed:`, error);
    // 嘗試從 H3Error 中獲取更詳細的訊息
    const message = error.data?.message || error.message || 'An error occurred during the encrypted request.';

    // 如果是解密失敗，可能需要特殊處理或提示
    if (error.message?.includes('decrypt')) console.error("Decryption likely failed.");
    // 重新拋出錯誤，讓調用者知道操作失敗
    throw new Error(message);
  }
}

// Start editing a comment
const startEdit = (comment: Comment) => { comment.isEditing = true; comment.editContent = comment.content; };

// Cancel comment editing
const cancelEdit = (comment: Comment) => { comment.isEditing = false; comment.editContent = ''; };

// Update a comment
const updateComment = async (post: UserPost, comment: Comment) => {
  const newContent = comment.editContent?.trim();
  if (!newContent || newContent === comment.content) {
    comment.isEditing = false; // 如果內容未變或為空，則取消編輯
    return;
  }

  const originalContent = comment.content;
  // 樂觀更新 UI
  comment.content = newContent;
  comment.isEditing = false;

  let shared: string | undefined;
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem('CUUID'); // 獲取 CUUID
    if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");

    // --- 手動加密流程 ---
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    // Payload 包含 token 和新內容
    const payload = { jwt, paseto, CUUID, content: newContent };
    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
    const requestBody: EncryptReq = {
      iv: encryptedCoreData.iv,
      encryptedMessage: encryptedCoreData.encryptedMessage,
      pubkey: pair.getPublic("hex")
    };
    // --- 加密流程結束 ---

    // **假設更新評論 API 是 /api/post/{postId}/comments/{commentId}**
    // **注意：你需要確認後端實際使用的 API 路徑**
    const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/comments/${comment.id}`, { // <--- 確認 API 路徑
      method: 'PUT', // 或 PATCH，取決於後端實現
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody)
    });

    // 檢查和解密回應 (假設成功時返回簡單的 success)
    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) {
        // 即使成功，後端也可能不返回加密體，只返回 2xx 狀態碼
        // 如果是這種情況，下面的解密會失敗，但操作可能已成功
        // 這裡假設成功時一定返回加密的 { success: true }
        console.warn("Update comment response might be missing encrypted data, assuming success based on status code.");
        // throw new Error("Invalid response from update comment API.");
    }

    // 嘗試解密，如果後端成功時不返回加密體，這一步會進入 catch
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    const response = JSON.parse(decryptedJsonString) as { success: boolean; message?: string };

    if (response && response.success) {
        console.log(`Comment ${comment.id} updated successfully.`);
        comment.editContent = ''; // 清空編輯內容
    } else {
        // 如果解密成功但 success 為 false
        throw new Error(response?.message || 'Failed to update comment');
    }

  } catch (err: any) {
    console.error(`Error updating comment ${comment.id}:`, err);
    // 出錯時恢復原狀
    comment.content = originalContent;
    comment.isEditing = true; // 保持編輯狀態以便用戶重試
    const message = err.data?.message || err.message || 'Unknown error';
    alert(`Failed to update comment: ${message}`);
  }
};

// Delete a comment
const deleteComment = async (post: UserPost, comment: Comment) => {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  const commentIndex = post.comments.findIndex((c) => c.id === comment.id);
  if (commentIndex === -1) return;

  // 樂觀更新 UI
  post.comments.splice(commentIndex, 1);
  post.commentCount--;

  let shared: string | undefined;
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem('CUUID');
    if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");

    // --- 手動加密流程 ---
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    // Payload 可能只需要 token，或為空，取決於後端是否需要 body 進行解密驗證
    const payload = { jwt, paseto, CUUID };
    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
    const requestBody: EncryptReq = {
      iv: encryptedCoreData.iv,
      encryptedMessage: encryptedCoreData.encryptedMessage,
      pubkey: pair.getPublic("hex")
    };
    // --- 加密流程結束 ---

    // **假設刪除評論 API 是 /api/post/{postId}/comments/{commentId}**
    // **注意：你需要確認後端實際使用的 API 路徑和方法**
    const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/comments/${comment.id}`, { // <--- 確認 API 路徑
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      // DELETE 請求通常不應該有請求體，但如果你的後端需要加密的 token 來驗證，則需要發送
      // 如果後端不需要 body，則移除 body: JSON.stringify(requestBody)
      body: JSON.stringify(requestBody)
    });

    // 檢查和解密回應 (假設成功時返回簡單的 success)
    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) {
       // 刪除成功後端可能只返回 204 No Content，沒有加密體
       console.log(`Comment ${comment.id} likely deleted successfully (based on status code).`);
       // throw new Error("Invalid response from delete comment API."); // 可能不需要拋錯
       return; // 直接返回，因為 UI 已經更新
    }

    // 嘗試解密
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    const response = JSON.parse(decryptedJsonString) as { success: boolean; message?: string };

    if (response && response.success) {
        console.log(`Comment ${comment.id} deleted successfully.`);
    } else {
        // 如果解密成功但 success 為 false
        throw new Error(response?.message || 'Failed to delete comment');
    }

  } catch (err: any) {
    console.error(`Error deleting comment ${comment.id}:`, err);
    // 恢復 UI (如果需要)
    // post.comments.splice(commentIndex, 0, comment); // 重新插入
    // post.commentCount++;
    const message = err.data?.message || err.message || 'Unknown error';
    alert(`Failed to delete comment: ${message}`);
    // 可能需要重新獲取帖子數據以同步狀態
  }
};

// Modified addComment function
// 添加評論
const addComment = async (post: UserPost) => {
  const content = post.newComment?.trim();
  if (!content) return;

  const currentCUUID = sessionStorage.getItem('CUUID');
  if (!currentCUUID) {
      console.error("Cannot add comment: User CUUID not found in sessionStorage.");
      alert("Failed to add comment: User information is missing.");
      return;
  }

  // 建立臨時評論用於 UI 顯示
  const tempCommentId = `temp-${Date.now()}`;
  const newCommentData: Comment = {
    id: tempCommentId,
    icon: user.value.icon || currentUser.value.icon,
    username: user.value.username || currentUser.value.username,
    userID: currentCUUID, // 使用從 sessionStorage 獲取的 CUUID
    date: new Date(),
    content: content,
    isEditing: false,
    editContent: ''
  };

  // 樂觀更新 UI
  post.comments.unshift(newCommentData);
  post.commentCount++;
  post.newComment = '';

  let shared: string | undefined;

  console.log("Adding comment to post:", post.id);
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem('CUUID');
    if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");

    // --- 加密流程 ---
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    
    // Payload 包含認證信息和評論內容
    const payload = { 
      jwt, 
      paseto, 
      CUUID, 
      content,
      // 可以添加其他可選參數，例如是否公開等
      isPublic: true 
    };
    
    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
    const requestBody: EncryptReq = { 
      iv: encryptedCoreData.iv,
      encryptedMessage: encryptedCoreData.encryptedMessage, 
      pubkey: pair.getPublic("hex") 
    };
    // --- 加密流程結束 ---

    const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody)
    });

    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) throw new Error("Invalid response from add comment API.");
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    const response = JSON.parse(decryptedJsonString) as { success: boolean; comment?: Comment; message?: string };

    if (response && response.success && response.comment) {
      // 用伺服器返回的真實評論替換臨時評論
      const savedComment = response.comment;
      const index = post.comments.findIndex(c => c.id === tempCommentId);
      if (index !== -1) {
        savedComment.date = new Date(savedComment.date); // 確保日期是 Date 對象
        // 如果伺服器沒有返回頭像，使用當前用戶頭像
        savedComment.icon = savedComment.icon || user.value.icon || currentUser.value.icon;
        post.comments[index] = savedComment;
        console.log(`Comment added successfully for post ${post.id}:`, savedComment);
      }
    } else {
      throw new Error(response?.message || 'Failed to add comment or invalid response');
    }
  } catch (err: any) {
    console.error(`Error adding comment for post ${post.id}:`, err);
    // 從 UI 中移除臨時評論
    const index = post.comments.findIndex(c => c.id === tempCommentId);
    if (index !== -1) post.comments.splice(index, 1);
    post.commentCount--;
    post.newComment = content; // 恢復輸入框內容
    const message = err.data?.message || err.message || 'Unknown error';
    alert(`Failed to add comment: ${message}`);
  }
};


//TODO: Note: get post

/* Mock function to fetch more posts
const fetchMorePosts = async (pageNumber: number) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return Array(5).fill(null).map((_, index) => ({
    id: Date.now() + index,
    icon: '📝',
    username: `User${pageNumber}_${index}`,
    userID: `user${pageNumber}_${index}`,
    date: new Date(), // Use current date for new posts
    title: `Post ${pageNumber}.${index}`,
    content: `This is post content for ${pageNumber}.${index}`,
    images: [`https://picsum.photos/800/${600 + index}`],
    tags: ['tag1', 'tag2'],
    likes: Math.floor(Math.random() * 100),
    commentCount: 0,
    isLiked: false,
    showComments: false,
    newComment: '',
    comments: []
  }));

};*/

// Setup intersection observer
const setupInfiniteScroll = () => {
  const options = { root: null, rootMargin: '0px', threshold: 0.5 };
  const observer = new IntersectionObserver(async (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore.value && !isLoading.value) {
      await fetchPosts(page.value); // 觸發加載下一頁
    }
  }, options);

  if (infiniteScrollTrigger.value) {
    observer.observe(infiniteScrollTrigger.value);
  }
  return observer;
};


// Error handling
const retryLoading = () => { fetchPosts(page.value); };

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

const isValidDate = (date: any) => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Add new methods
const openStory = (index: number) => { selectedStoryIndex.value = index; };

const closeStory = () => {
  selectedStoryIndex.value = null;
};

const openCreateStory = () => {
  showCreateStory.value = true;
};

// 獲取貼文
const fetchPosts = async (pageNumber: number) => {
  // 恢復 hasMore 檢查
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  error.value = null;
  console.log(`Fetching posts for page ${pageNumber}...`);
  let shared: string | undefined;

  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    if (!jwt || !paseto) throw new Error("Missing auth tokens.");

    // --- 手動加密流程 ---
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
    const pair = genKeyCurve25519();
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));

    // 準備 payload，包含 token 和分頁信息
    const payload = { jwt, paseto, page: pageNumber, limit: 10 }; // 假設每頁 10 條

    const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
    const requestBody: EncryptReq = {
      iv: encryptedCoreData.iv,
      encryptedMessage: encryptedCoreData.encryptedMessage,
      pubkey: pair.getPublic("hex")
    };
    // --- 加密流程結束 ---

    // **關鍵點：使用 POST 訪問 /api/post/userPostGet**
    const response_enc = await $fetch<EncryptedRes>('/api/post/userPostGet', { // <--- API 路徑
      method: 'POST', // <--- 使用 POST
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody) // 發送加密體
    });

    // 檢查加密回應結構
    if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) {
      throw new Error("Invalid response structure from userPostGet");
    }

    // 解密回應
    const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
    // 解析解密後的 JSON，期望包含 posts 和 hasMorePages
    const response = JSON.parse(decryptedJsonString) as { success: boolean; posts: UserPost[]; hasMorePages: boolean; message?: string };

    console.log('API Response (decrypted):', response);

    // 處理業務邏輯和數據
    if (response && response.success && Array.isArray(response.posts)) {
      const newPosts = response.posts.map(apiPost => ({
        ...apiPost,
        id: apiPost.id, // 確保 id 被正確映射
        likes: apiPost.likes ?? 0,
        isLiked: apiPost.isLiked ?? false,
        date: new Date(apiPost.date), // 轉換日期
        comments: (apiPost.comments || []).map(comment => ({
          ...comment,
          date: new Date(comment.date)
        })),
        // 確保 icon 存在且有前綴
        icon: apiPost.icon
            ? (apiPost.icon.startsWith('data:image') ? apiPost.icon : "data:image/png;base64," + apiPost.icon)
            : "data:image/png;base64," + new Identicon(sha3_256(apiPost.username || apiPost.userID), 100).toString()
      }));

      // 追加或替換數據
      if (pageNumber === 1) {
        displayedPosts.value = newPosts;
      } else {
        displayedPosts.value = [...displayedPosts.value, ...newPosts];
      }
      // 更新 hasMore 狀態
      hasMore.value = response.hasMorePages ?? (newPosts.length > 0);
      // 更新頁碼 (只有在還有更多頁時才增加)
      if (hasMore.value) {
          page.value = pageNumber + 1;
      }
      console.log('Posts loaded successfully. Total:', displayedPosts.value.length, 'Has more:', hasMore.value);
    } else {
      // 處理後端返回 success: false 或數據結構不對的情況
      console.warn('No posts found or invalid response structure:', response?.message);
      hasMore.value = false; // 沒有更多數據
      if (pageNumber === 1) displayedPosts.value = []; // 如果第一頁就失敗，清空列表
      // 可以選擇性地設置 error.value = response?.message
    }
  } catch (err: any) {
    console.error('Error fetching posts:', err);
    const message = err.data?.message || err.message || 'Failed to load posts.';
    error.value = message;
    hasMore.value = false; // 出錯時停止加載更多
  } finally {
    isLoading.value = false;
  }
};

// Add new methods for handling submissions
const handleStorySubmit = async (storyInputData: any) => {
  isLoading.value = true; // 可以添加一個特定的加載狀態
  error.value = null;
  console.log('Submitting story...');
  console.log(storyInputData);

  const jwt = sessionStorage.getItem('jwt');
  const paseto = sessionStorage.getItem('paseto');

  if (!jwt || !paseto) {
    console.error('Authentication tokens not found');
    navigateTo('/login');
    return;
  }

  let shared: string
  try {
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      throw new Error("Failed to get server public key.");
    }

    const pair = genKeyCurve25519()
    //const clientPubKey = pair.getPublic("hex")
    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"))
    storyInputData["jwt"] = jwt;
    storyInputData["paseto"] = paseto;
    storyInputData["image"] = storyInputData["image"]
    storyInputData["isPublic"] = true
    storyInputData["requestTime"] = new Date().toISOString()
    console.log(storyInputData)
    let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(storyInputData), shared)
    encrypt["pubkey"] = pair.getPublic("hex")

    const req = await $fetch('/api/stories/add', { 
      method: 'POST',
      body: JSON.stringify(encrypt),
    }).then((res: any) => RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv));
    let newStory = JSON.parse(req)
    //throw new Error("Testing")
    /**
     * if (response.user.icon == null) {
        //response.user.username
        response.user.icon = new Identicon(sha3_256(response.user.username), 100).toString()
        //data:image/png;base64,

      }
      response.user.icon = "data:image/png;base64," + response.user.icon
     */
    if (newStory) {
      
      if (newStory.userImage == newStory.username ) {
        newStory.userImage = new Identicon(sha3_256(newStory.userImage), 100).toString()
      }
      newStory.userImage = "data:image/png;base64,"+newStory.userImage

      // 假設 API 返回了創建的 Story 對象

      stories.value.unshift(newStory); // 添加到列表頂部
      showCreateStory.value = false; // 關閉模態框
      console.log('Story created successfully:', newStory);
    }
  } catch (err: any) {
    console.error('Error creating story:', err);
    alert(`Failed to create story: ${err.data?.message || 'Unknown error'}`);
    error.value = err.data?.message || 'Failed to create story.';
  } finally {
    isLoading.value = false;
  }
};

const handlePostSubmit = async (postSubmissionData: any) => {
  
  isLoading.value = true;
  
  error.value = null;

  console.log('Submitting post...', postSubmissionData);
  
  const jwt = sessionStorage.getItem('jwt');
  const paseto = sessionStorage.getItem('paseto');
  if (!jwt || !paseto) {
    console.error('Authentication tokens not found');
    navigateTo('/login');
    return;
  }  
  try {
    // 获取服务器公钥
    const servPubKeyData = await $fetch("/api/ECDHpubkey");    
    if (!servPubKeyData || !servPubKeyData.pubkey) {
      console.log("Failed to get server public key.");
      
      throw new Error("Failed to get server public key.");
    }
    
    // 生成密钥对和共享密钥
    const pair = genKeyCurve25519();
    const clientPubKey = pair.getPublic("hex");
    const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
    console.log("hi");
    
    // 提取图像数据
    let imageData = null;
    if (postSubmissionData.image) {
      imageData = typeof postSubmissionData.image === 'string' 
        ? postSubmissionData.image 
        : (postSubmissionData.image.base64 || null);
      console.log(`Image data found: ${imageData ? 'Yes' : 'No'}`);
      console.log(`Image data length: ${imageData ? imageData.length : 0}`);
      
      // Sanitize the image data
      if (imageData) {
        console.log("image data : ",imageData);
        
        imageData = sanitizeImageData(imageData);
        console.log('Image data sanitized');
      }
    }
    
    // 验证标题和内容长度
    if (!postSubmissionData.title || postSubmissionData.title.length < 4 || postSubmissionData.title.length > 40) {
      throw new Error("Title must be between 4 and 40 characters");
    }
    
    if (!postSubmissionData.content || postSubmissionData.content.length < 4 || postSubmissionData.content.length > 1000) {
      throw new Error("Content must be between 4 and 1000 characters");
    }
    
    // 准备帖子数据
    const postData = {
      jwt: jwt,
      paseto: paseto,
      isPublic: true,
      title: postSubmissionData.title,
      content: postSubmissionData.content,
      Image: imageData ? [imageData] : [],
      tags: postSubmissionData.tags || [],
      requestTime: new Date().toISOString()
    };
    
    console.log('Prepared post data:', {
      ...postData,
      jwt: '***REDACTED***',
      paseto: '***REDACTED***',
      Image: postData.Image.length > 0 ? [`Image data length: ${postData.Image[0].length}`] : []
    });
    
    // 加密数据
    let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(postData), shared);
    encrypt["pubkey"] = clientPubKey;
  
    // 发送到服务器
    const response = await $fetch<EncryptedRes>('/api/post/createPost', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    });
    
    console.log('Received server response:', response);
    
    if (!response || !response.encryptedMessage || !response.iv) {
      throw new Error('Invalid server response');
    }
    
    // 解密响应
    const decryptedResponse = await RequestEncryption.decryptMessage(
      response.encryptedMessage,
      shared,
      response.iv
    );
    
    console.log('Decrypted response:', decryptedResponse);
    
    let result;
    try {
      result = JSON.parse(decryptedResponse);
    } catch (parseError) {
      console.error('Failed to parse server response:', parseError);
      console.error('Raw response:', decryptedResponse);
      throw new Error('Invalid server response format');
    }
    
    if (!result.success && result.message) {
      console.error('Server reported failure:', result);
      throw new Error(result.message || 'Failed to create post');
    }
    
    // Handle the case where success is undefined but we have ID
    if (result.id) {
      console.log('Post created successfully with ID:', result.id);
      // Success case - continue with refresh
    } else if (result.success === undefined) {
      // If success is undefined and we don't have an ID, treat as error
      console.error('Unknown server response format:', result);
      throw new Error('Invalid server response format - success flag and ID missing');
    }
    
    // 成功创建帖子后刷新帖子列表
    //await fetchPosts(1);
    showCreatePost.value = false;
    alert('Post created successfully!');

    
  } catch (err: any) {
    console.error('Error creating post:', err);
    // Add more detailed error logging
    if (err.data) {
      console.error('Error data:', err.data);
    }
    if (err.message) {
      console.error('Error message:', err.message);
    }
    if (err.stack) {
      console.error('Error stack:', err.stack);
    }
    
    const errorMessage = err.data && err.data.message 
      ? err.data.message 
      : (err.message || 'Unknown error');
    
    alert(`Failed to create post: ${errorMessage}`);
    error.value = errorMessage;
  } finally {
    isLoading.value = false;
  }
};


// Add share function
const sharePost = (post: UserPost) => { shareModalPost.value = post; };

// 删除故事函数
const deleteStory = async (storyId: string | number) => {
  isLoading.value = true;
  error.value = null;
  
  console.log('Starting story deletion, ID:', storyId);
  
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');

    if (!jwt || !paseto) {
      console.error('Authentication tokens not found');
      navigateTo('/login');
      return;
    }

    // Removed redundant confirmation dialog since it's already handled in StoryViewer component
    
    console.log('Processing story deletion...');

    try {
      // 获取服务器公钥
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) {
        throw new Error("Failed to get server public key.");
      }
      console.log('Successfully retrieved server public key');

      // 生成密钥对并计算共享密钥
      const pair = genKeyCurve25519();
      const clientPubKey = pair.getPublic("hex");
      const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      console.log('Key generation completed');

      // 准备删除请求数据
      const deleteData = {
        jwt: jwt,
        paseto: paseto,
        storyUUID: storyId
      };
      console.log('Prepared deletion data:', deleteData);

      // 定义加密响应类型
      interface EncryptedResponse {
        encryptedMessage?: string;
        iv?: string;
        success?: boolean;
        message?: string;
        [key: string]: any;
      }

      // 加密数据
      let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(deleteData), shared);
      encrypt["pubkey"] = clientPubKey;
      console.log('数据加密完成');

      // 发送删除请求
      console.log('发送删除请求...');
      const response = await $fetch<EncryptedResponse>('/api/stories/userRemove', {
        method: 'POST',
        body: JSON.stringify(encrypt)
      });
      console.log('收到服务器响应:', response);

      // 检查响应
      if (!response) {
        throw new Error('Server returned an empty response');
      }

      let result;
      if (response.encryptedMessage && response.iv) {
        // 如果响应是加密的，进行解密
        console.log('Decrypting server response...');
        try {
          const decryptedData = await RequestEncryption.decryptMessage(
            response.encryptedMessage, 
            shared, 
            response.iv
          );
          result = JSON.parse(decryptedData);
          console.log('Decryption result:', result);
        } catch (decryptErr: any) {
          console.error('Decryption failed:', decryptErr);
          throw new Error(`Failed to decrypt response: ${decryptErr.message || 'Unknown decryption error'}`);
        }
      } else {
        // 如果响应不是加密的，直接使用
        result = response;
        console.log('Using unencrypted response:', result);
      }

      // 处理响应结果
      if (result && result.success) {
        console.log('Deletion successful, removing story from local list');
        // 从本地数组中移除已删除的故事
        const index = stories.value.findIndex(s => s.id === storyId);
        if (index !== -1) {
          stories.value.splice(index, 1);
        } else {
          console.warn('Could not find story to delete locally:', storyId);
        }
        
        // 关闭故事查看器
        closeStory();
        
        alert('Story successfully deleted');
      } else {
        throw new Error(result?.message || 'Failed to delete story, server did not return success status');
      }
    } catch (reqError) {
      console.error('Request processing error:', reqError);
      throw reqError;
    }
  } catch (err: any) {
    console.error('Error deleting story:', err);
    alert(`Failed to delete story: ${err.message || 'Unknown error'}`);
    error.value = err.message || 'Failed to delete story';
  } finally {
    isLoading.value = false;
  }
};

// Add the detectImageType function at the end of the script section
const detectImageType = (base64String: string): string | null => {
  try {
    // Remove the prefix if it exists to check only the actual base64 data
    const cleanedBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode the first few bytes of the base64 string
    const byteString = atob(cleanedBase64.substring(0, 100));
    
    // Convert the decoded byte string to an array of integers
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    
    // Check the first few bytes to identify the image type
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
    
    // Default to JPEG if can't be determined
    return 'jpeg';
  } catch (e) {
    console.error('Error detecting image type:', e);
    return null;
  }
};

// Add this function near the detectImageType function
const sanitizeImageData = (imageData: string): string => {
  if (!imageData) return '';
  
  // Make sure it has the proper data URL prefix
  if (!imageData.startsWith('data:image/')) {
    // Try to detect the image type
    const imageType = detectImageType(imageData) || 'jpeg';
    // Add the proper prefix
    return `data:image/${imageType};base64,${imageData.replace(/^data:image\/\w+;base64,/, '')}`;
  }
  
  // It already has the prefix, just return it
  return imageData;
};

</script>

<style scoped>
/* 添加暗色模式的背景色變數 */
:root {
  --dark-900: #1a1a1a;
  --dark-800: #2d2d2d;
}

.bg-dark-900 {
  background-color: var(--dark-900);
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

.bg-dark-800 {
  background-color: var(--dark-800);
}

/* 添加主題切換過渡效果 */
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 確保所有可能變化的元素都有平滑過渡 */
* {
  transition: background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* Add smooth transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

/* Add horizontal scrollbar styling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>