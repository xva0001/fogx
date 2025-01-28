<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Search, 
  Bell, 
  Sun, 
  Moon,
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  LogOut,
  X,
  Loader2
} from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import type { MenuItem } from './composables/Idashboard'
import { useDashboardData } from './composables/useDashboardData'

// State management
const searchQuery = ref('')
const isDarkMode = ref(false)
const currentRoute = ref('dashboard')
const sidebarExpanded = ref(false)
const isFocused = ref(false)
const isLoading = ref(false)
const showSuggestions = ref(false)
const suggestions = ref<Array<{ id: number; text: string }>>([])

const router = useRouter()
const route = useRoute()

// Initialize dashboard data
const {
  loading,
  tableLoading,
  stats,
  activityData,
  regionalData,
  activities,
  fetchActivityData,
  fetchRegionalData,
  fetchActivities,
  initializeData
} = useDashboardData()

// Search functionality
const fetchSuggestions = useDebounceFn(async (query: string) => {
  if (!query) {
    suggestions.value = []
    return
  }

  isLoading.value = true
  try {
    // 模擬 API 調用
    await new Promise(resolve => setTimeout(resolve, 500))
    suggestions.value = [
      { id: 1, text: `Search for "${query}"` },
      { id: 2, text: `${query} in posts` },
      { id: 3, text: `${query} in users` },
    ]
  } finally {
    isLoading.value = false
  }
}, 300)

// Watch search input
watch(searchQuery, (newValue) => {
  showSuggestions.value = true
  fetchSuggestions(newValue)
})

const handleSearch = () => {
  if (!searchQuery.value) return
  showSuggestions.value = false
  // 實現搜索邏輯
  console.log('Searching for:', searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  showSuggestions.value = false
}

const selectSuggestion = (suggestion: { id: number; text: string }) => {
  searchQuery.value = suggestion.text
  showSuggestions.value = false
  handleSearch()
}

// Click outside to close suggestions
const clickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSuggestions.value = false
  }
}

// Dashboard menu items
const dashboardMenuItems = computed<MenuItem[]>(() => [
  { 
    key: 'overview', 
    icon: LayoutDashboard, 
    label: 'Overview',
    route: '/dashboard'
  },
  { 
    key: 'users', 
    icon: Users, 
    label: 'Users',
    route: '/users'
  },
  { 
    key: 'activities', 
    icon: Activity, 
    label: 'Analytics',
    route: '/analytics'
  },
  { 
    key: 'settings', 
    icon: Settings, 
    label: 'Settings',
    route: '/settings'
  }
])

const bottomItems = computed<MenuItem[]>(() => [
  { 
    key: 'logout', 
    icon: LogOut, 
    label: 'Logout'
  }
])

// Event handlers
const handleNavigate = (item: MenuItem) => {
  if (item.route) {
    currentRoute.value = item.key
    router.push(item.route)
  }
  if (item.key === 'logout') {
    logout()
  }
}

const handleTimeRangeChange = (range: string) => {
  fetchActivityData(range)
}

const handleRegionChange = (region: string) => {
  fetchRegionalData(region)
}

const handleStatusFilterChange = (status: string) => {
  fetchActivities(status)
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

const logout = async () => {
  try {
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const viewAllActivities = () => {
  router.push('/activities')
}

// Lifecycle hooks
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  isDarkMode.value = savedTheme === 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  document.addEventListener('click', clickOutside)
  initializeData()
})

onUnmounted(() => {
  document.removeEventListener('click', clickOutside)
})
</script>

<template>
  <div class="min-h-screen bg-base-300">
    <!-- Top Navigation Bar -->
    <nav class="bg-base-200 shadow-lg fixed top-0 right-0 left-0 z-20" 
         :class="sidebarExpanded ? 'ml-64' : 'ml-16'">
      <div class="px-6 py-3 flex items-center justify-between">
        <!-- Search Area -->
        <div class="search-container group">
          <div class="relative flex items-center flex-1 max-w-xl">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search..." 
              @focus="isFocused = true"
              @blur="isFocused = false"
              @keydown.enter="handleSearch"
              class="input input-bordered w-full pl-10 pr-4 py-2 
                     bg-base-100/50 backdrop-blur-sm
                     border-2 transition-all duration-300 ease-in-out
                     placeholder:text-base-content/50
                     focus:outline-none focus:border-primary
                     group-hover:bg-base-100
                     group-hover:shadow-lg"
            />
            
            <Search 
              class="w-5 h-5 absolute left-3 
                     transition-all duration-300 ease-in-out
                     text-base-content/50
                     group-hover:text-primary
                     group-hover:scale-110"
              :class="{ 'text-primary scale-110': isFocused }"
            />

            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 opacity-0 group-hover:opacity-100
                     transition-all duration-300 ease-in-out
                     hover:text-primary"
            >
              <X class="w-4 h-4" />
            </button>

            <div 
              v-if="isLoading"
              class="absolute right-3 
                     animate-spin text-primary"
            >
              <Loader2 class="w-4 h-4" />
            </div>

            <!-- Search Suggestions -->
            <div
              v-if="showSuggestions && suggestions.length > 0"
              class="absolute z-50 w-full mt-2 top-full
                     bg-base-100 rounded-lg shadow-xl
                     border border-base-300
                     transform transition-all duration-300 ease-in-out
                     origin-top"
              :class="{ 
                'scale-y-100 opacity-100': showSuggestions,
                'scale-y-0 opacity-0': !showSuggestions 
              }"
            >
              <ul class="py-2">
                <li
                  v-for="suggestion in suggestions"
                  :key="suggestion.id"
                  @click="selectSuggestion(suggestion)"
                  class="px-4 py-2 cursor-pointer
                         hover:bg-base-200 
                         transition-colors duration-200
                         flex items-center space-x-2"
                >
                  <Search class="w-4 h-4 text-base-content/50" />
                  <span>{{ suggestion.text }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-6">
          <button class="btn btn-ghost btn-circle">
            <Bell class="h-5 w-5" />
          </button>
          <button class="btn btn-ghost btn-circle" @click="toggleTheme">
            <Sun v-if="isDarkMode" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>

          <div class="divider divider-horizontal"></div>

          <!-- User Actions -->
          <div class="flex items-center space-x-3">
            <span class="text-sm">Admin</span>
            <button class="btn btn-primary btn-sm" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Layout -->
    <div class="flex pt-16"> <!-- Add top padding to account for fixed navbar -->
      <!-- Sidebar -->
      <Sidebar 
        v-model:expanded="sidebarExpanded"
        :items="dashboardMenuItems"
        :bottom-items="bottomItems"
        :active-key="currentRoute"
        @item-click="handleNavigate"
      />

      <!-- Main Content -->
      <div 
        class="flex-1 p-8 transition-all duration-500"
        :class="sidebarExpanded ? 'ml-64' : 'ml-16'"
      >
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center h-full">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Dashboard Content -->
        <div v-else class="space-y-8">
          <!-- Statistics Cards -->
          <StatCards :stats="stats" />

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivityChart
              :data="activityData"
              @range-change="handleTimeRangeChange"
            />
            <DistributionChart
              :data="regionalData"
              @region-change="handleRegionChange"
            />
          </div>

          <!-- Activity Log Table -->
          <ActivityTable
            :activities="activities"
            :loading="tableLoading"
            @filter-change="handleStatusFilterChange"
            @view-all="viewAllActivities"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  @apply bg-base-200 rounded-lg p-6 shadow-lg transition-all duration-300;
}

.stat-card:hover {
  @apply transform -translate-y-1 shadow-xl;
}

.search-container {
  @apply relative w-full max-w-xl;
}

.input {
  @apply rounded-xl;
  @apply transition-all duration-300 ease-in-out;
}

.input:focus {
  @apply bg-base-100/70;
  @apply shadow-lg;
  @apply ring-2 ring-primary/20;
}

.btn,
.input,
.card {
  @apply transition-all duration-300;
}

.btn:hover {
  @apply transform scale-105;
}

.shadow-lg {
  @apply transition-shadow duration-300;
}

.flex-1 {
  @apply transition-all duration-500 ease-in-out;
}
</style>