<template>
  <div class="flex">
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRouteKey" @item-click="handleNavigate" />

    <main :class="[
      'min-h-screen transition-all duration-500 ease-in-out bg-base-300',
      'flex-1 pt-4',
      sidebarExpanded ? 'ml-64' : 'ml-16'
    ]">
      <div :class="[
        'mx-auto transition-all duration-500 ease-in-out p-8',
        sidebarExpanded ? 'max-w-5xl' : 'max-w-7xl'
      ]">
        <div class="card rounded-2xl overflow-hidden bg-base-200 shadow-xl relative">
          <!-- Header Area -->
          <div class="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
            <!-- Back Button -->
            <button class="btn btn-ghost btn-circle absolute top-4 left-4 text-white z-10" @click="goBack">
              <ArrowLeftIcon class="h-6 w-6" />
            </button>

            <!-- Theme Toggle -->
            <ClientOnly>
              <button class="btn btn-ghost btn-circle absolute top-4 right-4 text-white" @click="toggleTheme">
                <component :is="isDarkMode ? SunIcon : MoonIcon" class="h-5 w-5" />
              </button>
            </ClientOnly>
          </div>

          <!-- Profile Content -->
          <div class="card-body relative">
            <!-- Avatar -->
            <div class="absolute -top-16 left-8">
              <div class="avatar">
                <div
                  class="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 shadow-xl bg-white">
                  <img v-if="userProfile.icon" :src="userProfile.icon" :alt="userProfile.name"
                    class="w-full h-full object-cover" />
                  <UserIcon v-else class="w-16 h-16 mx-auto mt-8 text-base-content/70" />
                </div>
              </div>
            </div>

            <!-- Profile Info -->
            <div class="mt-20">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold">{{ userProfile.username }}</h2>
                  <p class="text-base-content/60">@{{ userProfile.username }}</p>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex gap-12 my-6">
                <div>
                  <div class="text-sm text-base-content/60">Posts</div>
                  <div class="text-2xl font-bold">{{ userProfile.stats.posts }}</div>
                </div>
                <div>
                  <div class="text-sm text-base-content/60">Followers</div>
                  <div class="text-2xl font-bold">{{ userProfile.stats.followerCount }}</div>
                </div>
                <div>
                  <div class="text-sm text-base-content/60">Following</div>
                  <div class="text-2xl font-bold">{{ userProfile.stats.followingCount }}</div>
                </div>
              </div>

              <!-- Bio -->
              <!-- <p class="text-base-content/80 mb-6">{{ userProfile.bio }}</p> -->

              <!-- Profile Links -->
              <div class="flex flex-wrap gap-6 text-base-content/70">
                <div v-if="userProfile.location" class="flex items-center gap-2">
                  <MapPinIcon class="w-5 h-5" />
                  <!-- <span>{{ userProfile.location }}</span> -->
                </div>
                <div v-if="userProfile.website" class="flex items-center gap-2">
                  <Link2Icon class="w-5 h-5" />
                  <!-- <a :href="userProfile.website" class="text-blue-600 hover:underline">
                    {{ userProfile.website }}
                  </a> -->
                </div>
                <!-- <div class="flex items-center gap-2">
                  <CalendarIcon class="w-5 h-5" />
                  <span>Joined {{ formatDate(userProfile.joinDate) }}</span>
                </div> -->
              </div>

              <!-- Posts Section -->
              <div class="mt-6 space-y-4">
                <div v-if="isLoading" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>

                <div v-else-if="error" class="text-center py-4 text-red-500">
                </div>
              </div>

              <!-- Tabs -->
              <div class="border-b border-base-content/10 mt-6">
                <div class="flex gap-8">
                  <button v-for="tab in tabs" :key="tab.id" class="relative pb-4" :class="[
                    'hover:text-blue-600 transition-colors',
                    currentTab === tab.id ? 'text-blue-600' : 'text-base-content/60'
                  ]" @click="currentTab = tab.id">
                    <component :is="tab.icon" class="w-6 h-6" />
                    <div v-if="currentTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  </button>
                </div>
              </div>

              <!-- Posts Section -->
              <div class="mt-6 space-y-4 relative">
                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>

                <!-- Error State
                <div v-else-if="error" class="text-center py-4 text-red-500">
                  {{ error }}
                  <button @click="fetchUserProfile" class="text-blue-500 hover:underline ml-2">
                    Retry
                  </button>
                </div> -->

                <!-- Posts List -->
                <div v-else class="space-y-4">
                  <div v-for="post in userProfile.posts" :key="post.id"
                    class="bg-base-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow relative">
                    <!-- Post Header -->
                    <div class="flex items-center space-x-3 mb-3">
                      <div class="w-10 h-10 rounded-full overflow-hidden bg-base-200">
                        <img v-if="post.icon" :src="post.icon" class="w-full h-full object-cover" />
                        <UserIcon v-else class="w-6 h-6 mx-auto mt-2 text-gray-400" />
                      </div>
                      <div>
                        <div class="font-semibold">{{ post.username }}</div>
                        <div class="text-xs text-base-content/60">{{ formatTimeAgo(post.date) }}</div>
                      </div>
                    </div>

                    <!-- Private Post Indicator -->
                    <div v-if="!post.isPublic" class="bg-base-200 rounded-lg p-4 text-center my-4">
                      <LockIcon class="w-5 h-5 mx-auto mb-2" />
                      <p class="text-base-content/60">This post is private</p>
                    </div>

                    <!-- Public Post Content -->
                    <div v-else>
                      <!-- Title and Content -->
                      <h3 v-if="post.title" class="font-bold text-lg mb-2">{{ post.title }}</h3>
                      <p class="text-base-content/70 mb-3 whitespace-pre-line">{{ post.content }}</p>

                      <!-- Images Gallery -->
                      <div v-if="post.images.length" class="grid gap-2 mb-3" :class="{
                        'grid-cols-1': post.images.length === 1,
                        'grid-cols-2': post.images.length > 1
                      }">
                        <div v-for="(img, idx) in post.images" :key="idx"
                          class="relative bg-base-200 rounded-lg overflow-hidden" style="aspect-ratio: 16/9">
                          <!-- 可自訂比例 -->
                          <img :src="img" class="absolute inset-0 w-full h-full object-contain p-1" loading="lazy" />
                        </div>
                      </div>

                      <!-- Tags -->
                      <div v-if="post.tags && post.tags.length" class="flex flex-wrap gap-2 mb-3">
                        <span v-for="tag in post.tags" :key="tag" class="badge badge-outline">
                          {{ tag }}
                        </span>
                      </div>
                    </div>

                    <!-- Post Actions -->
                    <div class="flex items-center justify-between border-t pt-3">
                      <button class="flex items-center space-x-1" :class="[
                        post.isLiked ? 'text-pink-500' : 'text-base-content/60 hover:text-pink-500'
                      ]" @click="toggleLike(post)">
                        <HeartIcon class="w-5 h-5" />
                        <span>{{ post.likes || 0 }}</span>
                      </button>

                      <button class="flex items-center space-x-1 text-base-content/60 hover:text-blue-500"
                        @click="toggleComments(post)">
                        <MessageSquareIcon class="w-5 h-5" />
                        <span>{{ post.commentCount || 0 }}</span>
                      </button>

                      <button v-if="true" @click="deletePost(post.id)"
                        class="btn btn-ghost btn-circle text-red-500 hover:bg-red-50">
                        <Trash2 class="w-5 h-5" />
                      </button>
                    </div>

                    <!-- Comments Section -->
                    <div v-if="post.showComments" class="mt-4 pt-4 border-t">
                      <!-- <div v-if="post.comments && post.comments.length" class="space-y-3 mb-3">
                        <div v-for="comment in post.comments" :key="comment.id" class="flex space-x-2">
                          <div class="w-8 h-8 rounded-full overflow-hidden bg-base-200">
                            <img v-if="comment.icon" :src="comment.icon" class="w-full h-full object-cover" />
                            <UserIcon v-else class="w-4 h-4 mx-auto mt-2 text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <div class="text-sm font-semibold">{{ comment.username }}</div>
                            <div class="text-sm text-base-content/70">{{ comment.content }}</div>
                          </div>
                        </div>
                      </div> -->

                      <!-- Add Comment -->
                      <!-- <div class="flex space-x-2 mt-2">
                        <input v-model="post.newComment" placeholder="Add a comment..."
                          class="input input-bordered input-sm flex-1" />
                        <button @click="addComment(post)" class="btn btn-sm btn-primary">Post</button>
                      </div> -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Post Button with scroll behavior -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
        <button v-show="showNewPostButton" class="btn btn-circle btn-primary shadow-lg fixed bottom-6 right-6 z-50"
          @click="openNewPost">
          <PlusIcon class="w-6 h-6" />
        </button>
      </Transition>

      <!-- Edit Profile Modal -->
      <!-- <dialog ref="editProfileModal" class="modal">
        <<div class="modal-box bg-base-200 rounded-2xl">
            <h3 class="font-bold text-lg mb-4">Edit Profile</h3>
            <form class="space-y-4">
              <div class="form-control">
                <label class="label">Name</label>
                <input type="text" v-model="editForm.name" class="input input-bordered" />
              </div>
              <div class="form-control">
                <label class="label">Username</label>
                <input type="text" v-model="editForm.username" class="input input-bordered" />
              </div>
              <div class="form-control">
                <label class="label">Bio</label>
                <textarea v-model="editForm.bio" class="textarea textarea-bordered"></textarea>
              </div>
              <div class="form-control">
                <label class="label">Location</label>
                <input type="text" v-model="editForm.location" class="input input-bordered" />
              </div>
              <div class="form-control">
                <label class="label">Website</label>
                <input type="text" v-model="editForm.website" class="input input-bordered" />
              </div>
            </form>
            <div class="modal-action">
              <button class="btn" @click="closeEditProfile">Cancel</button>
              <button class="btn btn-primary" @click="saveProfile">Save</button>
            </div>
          </div> 
      </dialog> -->

      <!-- New Post Modal
      <dialog ref="newPostModal" class="modal">
        <div class="modal-box bg-base-200 rounded-2xl">
          <h3 class="font-bold text-lg mb-4">New Post</h3>
          <form class="space-y-4">
            <div class="form-control">
              <label class="label">Title</label>
              <input type="text" v-model="newPost.title" class="input input-bordered" />
            </div>
            <div class="form-control">
              <label class="label">Content</label>
              <textarea v-model="newPost.content" class="textarea textarea-bordered" rows="4"></textarea>
            </div>
          </form>
          <div class="modal-action">
            <button class="btn" @click="closeNewPost">Cancel</button>
            <button class="btn btn-primary" @click="savePost">Post</button>
          </div>
        </div>
      </dialog> -->
    </main>
  </div>
</template>

<script setup>

import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  Sun as SunIcon,
  Moon as MoonIcon,
  User as UserIcon,
  MapPin as MapPinIcon,
  Link2 as Link2Icon,
  Calendar as CalendarIcon,
  ArrowLeft as ArrowLeftIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  MessageSquare as MessageSquareIcon,
  Image as ImageIcon,
  Heart as HeartIcon,
  Trash2,
  MessageSquare,
  Heart,
  LockIcon
} from 'lucide-vue-next'
import Sidebar from '~/components/Sidebar.vue'
import { useNavigation } from '~/composables/useNavigation'
import RequestEncryption from '~/shared/Request/requestEncrytion'
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn'
import { sha3_256 } from 'js-sha3'
import Identicon from 'identicon.js'
import Buffer from "buffer"

const {
  sidebarExpanded,
  currentRouteKey,
  navigationItems,
  bottomItems,
  handleNavigate,
  setActiveRoute
} = useNavigation()

const isDarkMode = ref(false)
const currentTab = ref('posts')
const editProfileModal = ref(null)
const newPostModal = ref(null)
const showNewPostButton = ref(true)
let lastScrollPosition = 0
let scrollTimeout

const userProfile = ref({
  username: '',
  email: '',
  icon: '',
  createdDate: '',
  lastestLoginDate: '',
  stats: {
    posts: "no Info now",
    followers: "no Info now",
    following: "no Info now"
  },
  posts: []
})

const isLoading = ref(false)
const error = ref(null)

const tabs = [
  { id: 'posts', icon: MessageSquareIcon },
  { id: 'media', icon: ImageIcon },
  { id: 'likes', icon: HeartIcon }
]

const fetchUserProfile = async () => {
  isLoading.value = true
  error.value = null

  try {
    const jwt = sessionStorage.getItem('jwt')
    const paseto = sessionStorage.getItem('paseto')
    if (!jwt || !paseto) {
      navigateTo('/login')
      return
    }

    const servPubKey = await $fetch("/api/ECDHpubkey")
    const pair = genKeyCurve25519()
    const shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    const packet = { jwt, paseto }
    const encrypt = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)
    encrypt.pubkey = pair.getPublic("hex")

    const response = await $fetch('/api/user/profileget', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    }).then(res => RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv))

    const data = JSON.parse(response)

    if (data.user.icon == data.user.username) {
      data.icon = new Identicon(sha3_256(data.user.username), 100).toString()

    }
    data.user.icon = "data:image/png;base64," + data.user.icon

    if (data.success && data.user) {
      userProfile.value = {
        ...data.user,
        stats: {
          posts: 0, // Will be fetched separately
          followers: 0,
          following: 0
        },
        posts: [] // Will be fetched separately
      }
    }
  } catch (err) {
    console.log(err);

    // error.value = err.message || 'Failed to load profile'
  } finally {
    isLoading.value = false
  }
}

const deletePost = async (postId) => {
  if (!confirm('Are you sure you want to delete this post?')) return

  try {
    const jwt = sessionStorage.getItem('jwt')
    const paseto = sessionStorage.getItem('paseto')
    if (!jwt || !paseto) {
      navigateTo('/login')
      return
    }

    const servPubKey = await $fetch("/api/ECDHpubkey")
    const pair = genKeyCurve25519()
    const shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    const packet = { jwt: jwt, paseto: paseto, postUUID: postId }
    const encrypt = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)
    encrypt.pubkey = pair.getPublic("hex")

    await $fetch(`/api/post/deletePost`, {
      method: 'POST',
      body: JSON.stringify(encrypt)
    })

    userProfile.value.posts = userProfile.value.posts.filter(p => p.id !== postId)
  } catch (err) {
    console.log(err);

    alert('Failed to delete post: ' + (err.message || 'Unknown error'))
  }
}

const editForm = ref({ ...userProfile.value })
const newPost = ref({ title: '', content: '' })

const toggleTheme = () => {
  if (process.client) {
    isDarkMode.value = !isDarkMode.value
    document.documentElement.dataset.theme = isDarkMode.value ? 'dark' : 'light'
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }
}

const formatTimeAgo = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date'

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const goBack = () => {
  history.back()//error:500
}

const openEditProfile = () => {
  editProfileModal.value?.showModal()
}

const closeEditProfile = () => {
  editProfileModal.value?.close()
}

const saveProfile = () => {
  userProfile.value = { ...editForm.value }
  closeEditProfile()
}

const openNewPost = () => {
  newPostModal.value?.showModal()
}

const closeNewPost = () => {
  newPostModal.value?.close()
  newPost.value = { title: '', content: '' }
}

const savePost = () => {
  userProfile.value.posts.unshift({
    id: Date.now(),
    ...newPost.value,
    date: new Date().toISOString()
  })
  closeNewPost()
}

const handleScroll = () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  const currentScroll = window.pageYOffset

  if (currentScroll > lastScrollPosition) {
    showNewPostButton.value = false
  } else {
    showNewPostButton.value = true
  }

  lastScrollPosition = currentScroll

  scrollTimeout = setTimeout(() => {
    showNewPostButton.value = true
  }, 1000)
}

const fetchUserPost = async () => {
  /**

  interface IPost_resp {
  id: string
  icon: string
  username: string
  userID: string
  isPublic: boolean // if true show title,content and images
  date: Date
  title: string
  content: string
  images: string[]
  tags: string[] //
  //ui can be null, show ''
  likes: number
  commentCount: number
  isLiked: boolean
  showComments: boolean
  newComment: string
  comments: any[]
}
   */
  try {
    const jwt = sessionStorage.getItem('jwt')
    const paseto = sessionStorage.getItem('paseto')
    if (!jwt || !paseto) {
      navigateTo('/login')
      return
    }

    const servPubKey = await $fetch("/api/ECDHpubkey")
    const pair = genKeyCurve25519()
    const shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    const packet = { jwt: jwt, paseto: paseto }
    const encrypt = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)
    encrypt.pubkey = pair.getPublic("hex")

    const resp = await $fetch(`/api/post/userPostGetProfile`, {
      method: 'POST',
      body: JSON.stringify(encrypt)
    }).then(async (res) => await RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv))

    const result = JSON.parse(resp)
    console.log(result);


    userProfile.value.posts = result

  } catch (err) {
    console.log(err);

    alert('Failed to get post: ' + (err.message || 'Unknown error'))
  }
}

onMounted(() => {
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme') || 'light'
    isDarkMode.value = savedTheme === 'dark'
    document.documentElement.dataset.theme = savedTheme
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
  fetchUserProfile()
  fetchUserPost()
  console.log(123);
  
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  }
})
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-box {
  max-height: 90vh;
}

/* Refined button transitions */
.btn {
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  transform: scale(1.05);
}

/* Balanced shadow for avatar */
.avatar .rounded-full {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Refined card shadows */
.bg-base-100 {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05),
    0 -1px 3px rgba(0, 0, 0, 0.02);
}

.bg-base-100:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07),
    0 -2px 4px rgba(0, 0, 0, 0.03);
}
</style>
