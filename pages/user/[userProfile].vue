<!-- UserProfile.vue -->
<template>








  <div class="flex">
    <Sidebar 
      v-model:expanded="sidebarExpanded"
      :items="profileMenuItems"
      :bottom-items="profileBottomItems"
      :active-key="currentRoute"
      @item-click="handleNavigate"
    />
      
      <!-- Main Content -->
      <main
        :class="[
          'min-h-screen transition-all duration-500 ease-in-out bg-base-300',
          'flex-1 pt-4',
          sidebarExpanded ? 'ml-64' : 'ml-16'
        ]"
      >
      <div 
        :class="[
          'mx-auto transition-all duration-500 ease-in-out p-8',
          sidebarExpanded ? 'max-w-5xl' : 'max-w-7xl'
        ]"
      >
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
                  <div class="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 shadow-xl bg-white">
                    <img 
                      v-if="userProfile.avatarUrl" 
                      :src="userProfile.avatarUrl" 
                      :alt="userProfile.name"
                      class="w-full h-full object-cover"
                    />
                    <UserIcon 
                      v-else 
                      class="w-16 h-16 mx-auto mt-8 text-base-content/70"
                    />
                  </div>
                </div>
              </div>
    
              <!-- Profile Info -->
              <div class="mt-20">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="text-2xl font-bold">{{ userProfile.name }}</h2>
                    <p class="text-base-content/60">@{{ userProfile.username }}</p>
                  </div>
                  <!-- Edit Profile Button -->
                  <button 
                    class="btn btn-ghost btn-circle"
                    @click="openEditProfile"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </button>
                </div>
    
                <!-- Stats -->
                <div class="flex gap-12 my-6">
                  <div>
                    <div class="text-sm text-base-content/60">Posts</div>
                    <div class="text-2xl font-bold">{{ userProfile.stats.posts }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-base-content/60">Followers</div>
                    <div class="text-2xl font-bold">{{ userProfile.stats.followers }}</div>
                  </div>
                  <div>
                    <div class="text-sm text-base-content/60">Following</div>
                    <div class="text-2xl font-bold">{{ userProfile.stats.following }}</div>
                  </div>
                </div>
    
                <!-- Bio -->
                <p class="text-base-content/80 mb-6">{{ userProfile.bio }}</p>
    
                <!-- Profile Links -->
                <div class="flex flex-wrap gap-6 text-base-content/70">
                  <div class="flex items-center gap-2">
                    <MapPinIcon class="w-5 h-5" />
                    <span>{{ userProfile.location }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Link2Icon class="w-5 h-5" />
                    <a :href="userProfile.website" class="text-blue-600 hover:underline">
                      {{ userProfile.websiteDisplay }}
                    </a>
                  </div>
                  <div class="flex items-center gap-2">
                    <CalendarIcon class="w-5 h-5" />
                    <span>Joined {{ formatDate(userProfile.joinDate) }}</span>
                  </div>
                </div>
    
                <!-- Tabs -->
                <div class="border-b border-base-content/10 mt-6">
                  <div class="flex gap-8">
                    <button 
                      v-for="tab in tabs" 
                      :key="tab.id"
                      class="relative pb-4"
                      :class="[
                        'hover:text-blue-600 transition-colors',
                        currentTab === tab.id ? 'text-blue-600' : 'text-base-content/60'
                      ]"
                      @click="currentTab = tab.id"
                    >
                      <component :is="tab.icon" class="w-6 h-6" />
                      <div 
                        v-if="currentTab === tab.id"
                        class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      ></div>
                    </button>
                  </div>
                </div>
    
                <!-- Posts Section -->
                <div class="mt-6 space-y-4 relative">
                  <!-- Posts -->
                  <div 
                    v-for="post in userProfile.posts" 
                    :key="post.id" 
                    class="bg-base-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <h3 class="font-bold text-lg mb-2">{{ post.title }}</h3>
                    <p class="text-base-content/70">{{ post.content }}</p>
                    <div class="mt-3 text-right">
                      <time class="text-sm text-base-content/60">
                        {{ formatDate(post.date) }}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    
        <!-- New Post Button with scroll behavior -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-4"
        >
          <button 
            v-show="showNewPostButton"
            class="btn btn-circle btn-primary shadow-lg fixed bottom-6 right-6 z-50"
            @click="openNewPost"
          >
            <PlusIcon class="w-6 h-6" />
          </button>
        </Transition>
    
        <!-- Edit Profile Modal -->
        <dialog ref="editProfileModal" class="modal">
          <div class="modal-box bg-base-200 rounded-2xl">
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
        </dialog>
    
        <!-- New Post Modal -->
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
        </dialog>
    </main>
    </div>
  </template>
  
  <script setup>

  import { ref, onMounted, onUnmounted } from 'vue'
  import {
    LayoutGrid,
    Users,
    FileText,
    BarChart2,
    MessageSquare,
    BellRing,
    Settings,
    LogOut,

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
    Heart as HeartIcon
  } from 'lucide-vue-next'
  import Sidebar from './components/Sidebar.vue'
  
  const sidebarExpanded = ref(false)
  const isDarkMode = ref(false)
  const currentTab = ref('posts')
  const editProfileModal = ref(null)
  const newPostModal = ref(null)
  const showNewPostButton = ref(true)
  let lastScrollPosition = 0
  let scrollTimeout
  
  // 添加菜單配置
  const currentRoute = ref('overview')

  const profileMenuItems = [
    { key: 'overview', icon: LayoutGrid, label: 'Overview' },
    { key: 'users', icon: Users, label: 'Users' },
    { key: 'posts', icon: FileText, label: 'Posts' },
    { key: 'analytics', icon: BarChart2, label: 'Analytics' },
    { key: 'messages', icon: MessageSquare, label: 'Messages' },
    { key: 'notifications', icon: BellRing, label: 'Notifications' }
  ]

  const profileBottomItems = [
    { key: 'settings', icon: Settings, label: 'Settings' },
    { key: 'logout', icon: LogOut, label: 'Logout' }
  ]

  // 添加導航處理函數
  const handleNavigate = (item) => {
    if (item.key === 'logout') {
      // 處理登出邏輯
      return
    }
    currentRoute.value = item.key
    // 這裡可以添加實際的路由導航邏輯
    // router.push(`/${item.key}`)
  }

  const userProfile = ref({
    name: 'John Doe',
    username: 'johndoe',
    avatarUrl: '',
    bio: 'Building secure communication platforms | Privacy advocate | Tech enthusiast',
    location: 'Hong Kong',
    website: 'https://msgfog.com',
    websiteDisplay: 'msgfog.com',
    joinDate: '2024-01-01',
    stats: {
      posts: 123,
      followers: 1234,
      following: 567
    },
    posts: [
      {
        id: 1,
        title: 'Latest Update',
        content: 'We just released new security features...',
        date: '2025-01-19T10:00:00'
      },
      {
        id: 2,
        title: 'Tech Share',
        content: 'Thoughts and experiences on end-to-end encryption...',
        date: '2025-01-18T15:30:00'
      }
    ]
  })
  
  const tabs = [
    { 
      id: 'posts', 
      icon: MessageSquareIcon
    },
    { 
      id: 'media', 
      icon: ImageIcon
    },
    { 
      id: 'likes', 
      icon: HeartIcon
    }
  ]
  
  const editForm = ref({...userProfile.value})
  const newPost = ref({ title: '', content: '' })
  
  const toggleTheme = () => {
    if (process.client) {
      isDarkMode.value = !isDarkMode.value
      document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    }
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
    userProfile.value = {...editForm.value}
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
  
  onMounted(() => {
    if (process.client) {
      const savedTheme = localStorage.getItem('theme') || 'light'
      isDarkMode.value = savedTheme === 'dark'
      document.documentElement.setAttribute('data-theme', savedTheme)
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
  })
  
  onUnmounted(() => {
    if (process.client) {
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