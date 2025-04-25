<template>
    <div :class="isDark ? 'text-gray-100 bg-dark-900' : 'bg-gray-50 text-gray-900'" class="min-h-screen">
      <!-- Sidebar Offset -->
      <div class="transition-all duration-500" :style="{ marginLeft: sidebarExpanded ? '16rem' : '4rem' }">
        <div class="max-w-2xl mx-auto p-4">
        <!-- TOP HEADER -->
        <header class="sticky rounded-md top-0 z-50 backdrop-blur-sm transition-colors duration-300 mb-4"
        :class="isDark ? 'text-gray-100 bg-dark-800 border-gray-800' : 'bg-gray-50 text-gray-900 border-gray-200'">
        <div class="flex items-center justify-between p-4">
            <button @click="goBack" class="flex items-center space-x-2" 
            :class="isDark ? 'text-gray-200' : 'text-gray-700'">
            <ArrowLeftIcon name="bi:arrow-left-short" class="w-6 h-6" />
            <span>Back</span>
            </button>
            
            <DarkModeBtn />
        </div>
        </header>
  
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center p-10">
            <Loader2 class="w-8 h-8 animate-spin mx-auto" />
            <p class="mt-2">Loading post...</p>
          </div>
  
          <!-- Error State -->
          <div v-else-if="error" class="text-center p-10 text-red-500">
            <Heart name="bi:exclamation-triangle" class="w-8 h-8 mx-auto mb-2" />
            <p>{{ error }}</p>
          </div>
  
          <!-- Post Content -->
          <div v-else-if="postDetails" class="space-y-6">
            <!-- Post Card -->
            <div class="rounded-xl shadow-sm overflow-hidden" 
              :class="isDark ? 'bg-dark-800' : 'bg-white'">
              <!-- Post Header -->
              <div class="p-4 border-b" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                    <img v-if="postDetails.icon && postDetails.icon.startsWith('data:image')"
                      :src="postDetails.icon"
                      :alt="`${postDetails.username}'s avatar`"
                      class="w-full h-full object-cover">
                    <span v-else class="text-gray-500 dark:text-gray-400 font-bold">
                      {{ postDetails.username ? postDetails.username.charAt(0).toUpperCase() : '?' }}
                    </span>
                  </div>
                  <div>
                    <div class="font-semibold">{{ postDetails.username }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatTimeAgo(postDetails.date) }}</div>
                  </div>
                </div>
              </div>
  
              <!-- Post Body -->
              <div class="p-6">
                <h1 class="text-2xl font-bold mb-4">{{ postDetails.title }}</h1>
                <div class="space-y-4" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                  <p class="whitespace-pre-wrap">{{ postDetails.content }}</p>
                  
                  <!-- Images -->
                  <ImageBox v-if="postDetails.images && postDetails.images.length > 0" 
                    class="pt-2" :images="postDetails.images" />
                  
                  <!-- Tags -->
                  <div v-if="postDetails.tags && postDetails.tags.length > 0" class="flex flex-wrap gap-2 mt-4">
                    <span v-for="tag in postDetails.tags" :key="tag" class="px-3 py-1 rounded-full text-sm"
                      :class="isDark ? 'text-blue-400 bg-blue-900/30' : 'bg-blue-50 text-blue-600'">
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
  
              <!-- Post Footer -->
              <div class="px-6 py-4 flex items-center justify-between border-t" 
                :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div class="flex items-center space-x-6">
                  <button @click="toggleLike(postDetails)" class="flex items-center space-x-2"
                    :class="postDetails.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'">
                    <Heart class="h-5 w-5" :fill="postDetails.isLiked ? 'currentColor' : 'none'" />
                    <span>{{ postDetails.likes }}</span>
                  </button>
                  <button @click="toggleComments(postDetails)" class="flex items-center space-x-2"
                    :class="postCommentVisible ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'">
                    <MessageCircle class="w-5 h-5" />
                    <span>{{ postDetails.commentCount }}</span>
                  </button>
                  <button @click="sharePost(postDetails)" class="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                    <Share2 class="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
  
            <!-- Comments Section -->
            <div v-if="postCommentVisible" class="space-y-4">
              <h2 class="text-xl font-bold">Comments</h2>
              
              <!-- Add Comment Form -->
              <div class="rounded-xl shadow-sm p-4 mb-4" :class="isDark ? 'bg-dark-800' : 'bg-white'">
                <div class="flex items-center space-x-3 mb-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                    :class="isDark ? 'bg-gray-700' : 'bg-gray-200'">
                    <img v-if="currentUserInfo.icon && currentUserInfo.icon.startsWith('data:image')"
                      :src="currentUserInfo.icon"
                      alt="Your avatar"
                      class="w-full h-full object-cover">
                    <span v-else class="text-gray-500 dark:text-gray-400 font-bold">
                      {{ currentUserInfo.username ? currentUserInfo.username.charAt(0).toUpperCase() : 'Y' }}
                    </span>
                  </div>
                  <span class="text-sm font-medium">{{ currentUserInfo.username }}</span>
                </div>
                
                <textarea 
                  v-model="postDetails.newComment"
                  class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500 transition"
                  :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'"
                  rows="3" 
                  placeholder="Share your thoughts..."
                ></textarea>
                
                <div class="flex justify-end mt-3">
                    <button @click="addComment(postDetails)"
                        class="px-4 py-2 rounded-full transition-colors duration-300 flex items-center space-x-2"
                        :class="[
                            isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
                            'text-white'
                        ]"
                        :disabled="!postDetails.newComment?.trim()">
                        <SendIcon class="h-4 w-4" />
                        <span>Post comment</span>
                    </button>
                </div>
              </div>
              
              <!-- Comments List -->
              <div v-if="postDetails.comments.length > 0" class="space-y-4">
                <div v-for="comment in postDetails.comments" :key="comment.id" 
                  class="rounded-xl shadow-sm p-4 relative" 
                  :class="isDark ? 'bg-dark-800' : 'bg-white'">
                  
                  <!-- Normal View Mode -->
                  <div v-if="!comment.isEditing">
                    <div class="flex items-center space-x-3 mb-2">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                        :class="isDark ? 'bg-gray-700' : 'bg-gray-200'">
                        <img v-if="comment.icon && comment.icon.startsWith('data:image')"
                          :src="comment.icon"
                          :alt="`${comment.username}'s avatar`"
                          class="w-full h-full object-cover">
                        <span v-else class="text-gray-500 dark:text-gray-400 font-bold">
                          {{ comment.username ? comment.username.charAt(0).toUpperCase() : '?' }}
                        </span>
                      </div>
                      <div>
                        <div class="font-medium">{{ comment.username }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimeAgo(comment.date) }}</div>
                      </div>
                    </div>
                    
                    <p class="mt-2 whitespace-pre-wrap">{{ comment.content }}</p>
                    
                    <!-- Comment Actions (if owner) -->
                    <div v-if="comment.userID === currentUserInfo.CUUID" 
                      class="absolute top-4 right-4 flex space-x-2">
                      <button @click="startEdit(comment)"
                        class="px-3 py-1 rounded-full text-xs bg-blue-500 text-white hover:bg-blue-600">
                        Edit
                      </button>
                      <button @click="deleteComment(postDetails, comment)"
                        class="px-3 py-1 rounded-full text-xs bg-red-500 text-white hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <!-- Edit Mode -->
                  <div v-else class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
                    <textarea v-model="comment.editContent"
                      class="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500 min-h-[100px]"
                      :class="isDark ? 'bg-dark-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300'"></textarea>
                    <div class="flex justify-end space-x-2 mt-2">
                      <button @click="cancelEdit(comment)"
                        class="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-800">
                        Cancel
                      </button>
                      <button @click="updateComment(postDetails, comment)"
                        class="px-4 py-2 rounded-full text-sm bg-blue-500 text-white hover:bg-blue-600"
                        :disabled="!comment.editContent?.trim()">
                        {{ comment.editContent ? 'Save' : 'Cannot Save Empty' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- No Comments -->
              <div v-else class="text-center p-6 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 rounded-xl">
                No comments yet. Be the first to share your thoughts!
              </div>
            </div>
          </div>
          
          <!-- Post Not Found -->
          <div v-else class="text-center p-10 text-gray-500">
            Post not found or could not be loaded.
          </div>
        </div>
      </div>
      
      <!-- Share Modal -->
      <ShareModal v-if="shareModalPost" :is-open="!!shareModalPost" :post="shareModalPost"
        @close="shareModalPost = null" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import ImageBox from '~/components/ImageBox.vue';
  import Comment from '~/components/Comment.vue';
  import ShareModal from '~/components/ShareModal.vue';
  import { useNavigation } from '~/composables/useNavigation';
  import RequestEncryption from '~/shared/Request/requestEncrytion';
  import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
  import type { EncryptedRes } from '~/shared/Request/IEncryptRes';
  import type { EncryptReq } from '~/shared/Request/IEncryptReq';
  import Identicon from 'identicon.js';
  import { sha3_256 } from 'js-sha3';
  import {
    Loader2,
    Heart,
    MessageCircle,
    Share2,
    Icon,
    ArrowLeft as ArrowLeftIcon,
    Send as SendIcon,
    AlertTriangle as AlertTriangleIcon
  } from 'lucide-vue-next';
  import DarkModeBtn from '~/components/DarkModeBtn.vue';

  // Interfaces
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
    comments: CommentData[];
  }
  
  interface CommentData {
    id: number | string;
    icon: string;
    username: string;
    userID: string;
    date: Date | string;
    content: string;
    isEditing?: boolean;
    editContent?: string;
  }
  
  // State setup
  const { sidebarExpanded } = useNavigation();
  const route = useRoute();
  const router = useRouter();
  const postDetails = ref<UserPost | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const DarkMode = useThemeStore();
  const isDark = ref(DarkMode.isDark);
  const shareModalPost = ref<UserPost | null>(null);
  const postCommentVisible = ref(false);
  
  // User info state (enhanced)
  const currentUserInfo = ref({
    icon: '',
    username: 'You',
    CUUID: sessionStorage.getItem('CUUID') || 'unknown-user'
  });
  
  // Navigation handler
  const goBack = () => {
    router.back();
  };
  
  // Fetch post details
  const fetchPostDetails = async (postId: string) => {
    if (!postId || postId === 'undefined') {
      error.value = "Invalid post ID";
      console.error("fetchPostDetails called with invalid ID:", postId);
      isLoading.value = false;
      return;
    }
  
    console.log(`Starting API call to fetch details for postId: ${postId}`);
    isLoading.value = true;
    error.value = null;
    postDetails.value = null;
    
    let shared: string | undefined;
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
  
    if (!jwt || !paseto) {
      error.value = "Authentication token missing.";
      isLoading.value = false;
      return;
    }
  
    try {
      // Encryption Setup
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
      const pair = genKeyCurve25519();
      shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
  
      // Prepare Payload
      const payload = {
        jwt: jwt,
        paseto: paseto,
        postUUID: postId
      };
  
      const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
      const requestBody: EncryptReq = {
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage,
        pubkey: pair.getPublic("hex")
      };
  
      // API Call
      const response_enc = await $fetch<EncryptedRes>(`/api/post/getPostById`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(requestBody)
      });
  
      if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) {
        throw new Error("Invalid response structure from getPostById");
      }
  
      // Decrypt & Process
      const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
      const response = JSON.parse(decryptedJsonString) as { success: boolean; post: UserPost; message?: string };
  
      if (response && response.success && response.post) {
        const fetchedPost = response.post;
        
        // Process fetched data
        fetchedPost.date = new Date(fetchedPost.date);
        fetchedPost.comments = (fetchedPost.comments || []).map(c => ({
          ...c,
          date: new Date(c.date),
          isEditing: false,
          editContent: ''
        }));
        fetchedPost.showComments = false;
        fetchedPost.newComment = '';
  
        // Fix icons/avatars
        if (!fetchedPost.icon) {
          fetchedPost.icon = "data:image/png;base64," + new Identicon(sha3_256(fetchedPost.username || fetchedPost.userID), 100).toString();
        } else if (!fetchedPost.icon.startsWith('data:image')) {
          fetchedPost.icon = "data:image/png;base64," + fetchedPost.icon;
        }
  
        // Process comment icons
        fetchedPost.comments.forEach(comment => {
          if (!comment.icon) {
            comment.icon = "data:image/png;base64," + new Identicon(sha3_256(comment.username || comment.userID), 100).toString();
          } else if (!comment.icon.startsWith('data:image')) {
            comment.icon = "data:image/png;base64," + comment.icon;
          }
        });
  
        postDetails.value = fetchedPost;
        // Auto-expand comments if there are any
        if (fetchedPost.comments.length > 0) {
          postCommentVisible.value = true;
        }
        error.value = null;
      } else {
        throw new Error(response?.message || 'Failed to fetch post details');
      }
    } catch (err: any) {
      console.error("Error fetching post details:", err);
      error.value = err.message || 'Could not load post.';
      postDetails.value = null;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Auth header helper
  const getAuthHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem('jwt');
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
  };
  
  // Time formatting
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    // For older dates, show actual date
    return date.toLocaleDateString();
  };
  
  // Toggle comments visibility
  const toggleComments = (post: UserPost | null) => {
    if (post) {
      postCommentVisible.value = !postCommentVisible.value;
    }
  };
  
  // Like interaction
  const toggleLike = async (post: UserPost | null) => {
    if (!post) return;
    
    const originalLiked = post.isLiked;
    const originalLikes = post.likes ?? 0;
    post.isLiked = !post.isLiked;
    post.likes = originalLikes + (post.isLiked ? 1 : -1);
    
    try {
      const jwt = sessionStorage.getItem('jwt');
      const paseto = sessionStorage.getItem('paseto');
      const CUUID = sessionStorage.getItem('CUUID');
      
      if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");
  
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
      const pair = genKeyCurve25519();
      const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      const payload = { jwt, paseto, CUUID, action: post.isLiked ? 'like' : 'unlike' };
      const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
      const requestBody: EncryptReq = { 
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage, 
        pubkey: pair.getPublic("hex") 
      };
  
      const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(requestBody)
      });
  
      if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) throw new Error("Invalid response from like API.");
      const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
      const response = JSON.parse(decryptedJsonString) as { success: boolean; likes?: number; isLiked?: boolean; message?: string };
  
      if (response && response.success) {
        post.likes = response.likes ?? post.likes;
        post.isLiked = response.isLiked ?? post.isLiked;
      } else {
        throw new Error(response?.message || 'Failed to update like status');
      }
    } catch (err: any) {
      console.error(`Error toggling like for post ${post.id}:`, err);
      post.isLiked = originalLiked; // Revert UI on error
      post.likes = originalLikes;
      alert(`Failed to update like status: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Comment functions
  const sharePost = (post: UserPost | null) => {
    if (post) {
      shareModalPost.value = post;
    }
  };
  
  const startEdit = (comment: CommentData) => { 
    comment.isEditing = true; 
    comment.editContent = comment.content; 
  };
  
  const cancelEdit = (comment: CommentData) => { 
    comment.isEditing = false; 
    comment.editContent = ''; 
  };
  
  const addComment = async (post: UserPost | null) => {
    if (!post || !post.newComment?.trim()) return;
    const content = post.newComment.trim();
    const currentCUUID = currentUserInfo.value.CUUID;
    if (!currentCUUID || currentCUUID === 'unknown-user') {
      alert("Cannot add comment: User ID not available.");
      return;
    }
  
    const tempCommentId = `temp-${Date.now()}`;
    const newCommentData: CommentData = {
      id: tempCommentId,
      icon: currentUserInfo.value.icon || "data:image/png;base64," + new Identicon(sha3_256(currentUserInfo.value.username), 100).toString(),
      username: currentUserInfo.value.username,
      userID: currentCUUID,
      date: new Date(),
      content: content,
      isEditing: false,
      editContent: ''
    };
  
    post.comments.unshift(newCommentData);
    post.commentCount++;
    post.newComment = '';
  
    try {
      const jwt = sessionStorage.getItem('jwt');
      const paseto = sessionStorage.getItem('paseto');
      if (!jwt || !paseto) throw new Error("Missing auth tokens.");
  
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
      const pair = genKeyCurve25519();
      const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      const payload = { jwt, paseto, CUUID: currentCUUID, content, isPublic: true };
      const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
      const requestBody: EncryptReq = { 
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage, 
        pubkey: pair.getPublic("hex") 
      };
  
      const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(requestBody)
      });
  
      if (!response_enc || !response_enc.encryptedMessage || !response_enc.iv) throw new Error("Invalid response from add comment API.");
      const decryptedJsonString = await RequestEncryption.decryptMessage(response_enc.encryptedMessage, shared, response_enc.iv);
      const response = JSON.parse(decryptedJsonString) as { success: boolean; comment?: CommentData; message?: string };
  
      if (response && response.success && response.comment) {
        const savedComment = response.comment;
        const index = post.comments.findIndex(c => c.id === tempCommentId);
        if (index !== -1) {
          savedComment.date = new Date(savedComment.date);
          
          // Ensure comment icon is properly formatted
          if (!savedComment.icon) {
            savedComment.icon = "data:image/png;base64," + new Identicon(sha3_256(savedComment.username || savedComment.userID), 100).toString();
          } else if (!savedComment.icon.startsWith('data:image')) {
            savedComment.icon = "data:image/png;base64," + savedComment.icon;
          }
          
          post.comments[index] = savedComment;
        }
      } else {
        throw new Error(response?.message || 'Failed to add comment');
      }
    } catch (err: any) {
      console.error(`Error adding comment for post ${post.id}:`, err);
      const index = post.comments.findIndex(c => c.id === tempCommentId);
      if (index !== -1) post.comments.splice(index, 1);
      post.commentCount--;
      post.newComment = content;
      alert(`Failed to add comment: ${err.message || 'Unknown error'}`);
    }
  };
  
  const updateComment = async (post: UserPost | null, comment: CommentData) => {
    if (!post || !comment.editContent?.trim() || comment.editContent.trim() === comment.content) {
      cancelEdit(comment);
      return;
    }
    
    const newContent = comment.editContent.trim();
    const originalContent = comment.content;
    comment.content = newContent;
    comment.isEditing = false;
  
    try {
      const jwt = sessionStorage.getItem('jwt');
      const paseto = sessionStorage.getItem('paseto');
      const CUUID = sessionStorage.getItem('CUUID');
      if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");
  
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
      const pair = genKeyCurve25519();
      const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      const payload = { jwt, paseto, CUUID, content: newContent };
      const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
      const requestBody: EncryptReq = { 
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage, 
        pubkey: pair.getPublic("hex") 
      };
  
      const response_enc = await $fetch<EncryptedRes>(`/api/post/${post.id}/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(requestBody)
      });
  
      console.log(`Comment ${comment.id} updated successfully.`);
      comment.editContent = '';
    } catch (err: any) {
      console.error(`Error updating comment ${comment.id}:`, err);
      comment.content = originalContent;
      comment.isEditing = true;
      alert(`Failed to update comment: ${err.message || 'Unknown error'}`);
    }
  };
  
  const deleteComment = async (post: UserPost | null, comment: CommentData) => {
    if (!post || !confirm('Are you sure you want to delete this comment?')) return;
  
    const commentIndex = post.comments.findIndex((c) => c.id === comment.id);
    if (commentIndex === -1) return;
  
    const originalComments = [...post.comments];
    post.comments.splice(commentIndex, 1);
    post.commentCount--;
  
    try {
      const jwt = sessionStorage.getItem('jwt');
      const paseto = sessionStorage.getItem('paseto');
      const CUUID = sessionStorage.getItem('CUUID');
      if (!jwt || !paseto || !CUUID) throw new Error("Missing auth tokens or CUUID.");
  
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      if (!servPubKeyData || !servPubKeyData.pubkey) throw new Error("Failed to get server public key.");
      const pair = genKeyCurve25519();
      const shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      const payload = { jwt, paseto, CUUID };
      const encryptedCoreData = await RequestEncryption.encryptMessage(JSON.stringify(payload), shared);
      const requestBody: EncryptReq = { 
        iv: encryptedCoreData.iv,
        encryptedMessage: encryptedCoreData.encryptedMessage, 
        pubkey: pair.getPublic("hex") 
      };
  
      await $fetch(`/api/post/${post.id}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(requestBody)
      });
  
      console.log(`Comment ${comment.id} deleted successfully.`);
    } catch (err: any) {
      console.error(`Error deleting comment ${comment.id}:`, err);
      post.comments = originalComments;
      post.commentCount++;
      alert(`Failed to delete comment: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Enhanced current user info fetch
  const fetchCurrentUserInfo = async () => {
    const cuuid = sessionStorage.getItem('CUUID');
    if (!cuuid) {
      console.warn("CUUID not found in session storage");
      return;
    }
    
    try {
      // Generate default icon based on CUUID
      const defaultIcon = "data:image/png;base64," + new Identicon(sha3_256(cuuid), 100).toString();
      
      // Try to get username from localStorage or other storage
      const username = sessionStorage.getItem('username') || 'You';
      
      // Update current user info
      currentUserInfo.value = {
        icon: defaultIcon,
        username: username,
        CUUID: cuuid
      };
      
      // Optionally fetch additional user info from API here if needed
    } catch (err) {
      console.error("Error generating user icon:", err);
    }
  };
  
  // Lifecycle
  onMounted(async () => {
    // Theme setup
    if (process.client) {
      isDark.value = localStorage.getItem('theme') === 'dark';
      document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light';
    }
    
    // Fetch user info
    await fetchCurrentUserInfo();
    
    // Wait for router to be ready
    await router.isReady();
    
    // Get post ID using multiple approaches
    let postIdToUse;
    
    // First try from route params
    if (route.params.postId) {
      postIdToUse = route.params.postId as string;
      console.log("Got postId from route params:", postIdToUse);
    }
    // If that fails, try extracting from URL directly
    else if (process.client) {
      const pathParts = window.location.pathname.split('/');
      postIdToUse = pathParts[pathParts.length - 1];
      console.log("Extracted postId from URL:", postIdToUse);
    }
    
    if (postIdToUse) {
      fetchPostDetails(postIdToUse);
    } else {
      console.warn("Could not determine postId by any method");
      error.value = "Could not determine which post to display";
      isLoading.value = false;
    }
  });
  
  // Watch for route changes
  watch(
    () => route.params.postId,
    (newPostId) => {
      if (newPostId && newPostId !== 'undefined') {
        console.log(`Route parameter changed to: ${newPostId}`);
        fetchPostDetails(newPostId as string);
      }
    },
    { immediate: true }
  );
  </script>
  
  <style scoped>
  .whitespace-pre-wrap {
    white-space: pre-wrap;
  }
  
  .theme-transition {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }
  
  .bg-dark-900 {
    background-color: #121212;
  }
  
  .bg-dark-800 {
    background-color: #1e1e1e;
  }
  
  .bg-dark-700 {
    background-color: #2d2d2d;
  }
  
  /* Enhanced comment transitions */
  .comment-enter-active,
  .comment-leave-active {
    transition: all 0.3s ease;
  }
  
  .comment-enter-from,
  .comment-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
  </style>
  