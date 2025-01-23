<!-- ActivityTable.vue -->
<template>
  <div class="card bg-base-200 dark:bg-gray-800">
    <div class="card-body p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="card-title text-base-content dark:text-white">Activity Log</h2>
        <div class="flex space-x-4">
          <select v-model="filter" 
            @change="handleFilterChange"
            class="select select-sm select-bordered dark:bg-gray-700 dark:text-white">
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <button class="btn btn-primary btn-sm">
            View All
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr class="bg-base-300 dark:bg-gray-700">
              <th class="text-base-content dark:text-gray-300" v-for="header in tableHeaders" :key="header">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="text-base-content dark:text-gray-300">
            <tr v-for="activity in displayedActivities" :key="activity.id">
              <td class="flex items-center space-x-2">
                <div class="avatar">
                  <div class="w-8 h-8 rounded-full">
                    <img 
                      :src="activity.user.avatar" 
                      :alt="activity.user.name"
                      @error="handleImageError"
                    />
                  </div>
                </div>
                <span>{{ activity.user.name }}</span>
              </td>
              <td>{{ getActionText(activity.action) }}</td>
              <td>{{ formatTimestamp(activity.timestamp) }}</td>
              <td>
                <div :class="[
                  'badge',
                  {
                    'badge-success dark:bg-green-700': activity.status === 'success',
                    'badge-error dark:bg-red-700': activity.status === 'failed',
                    'badge-warning dark:bg-yellow-700': activity.status === 'pending'
                  }
                ]">
                  {{ getStatusText(activity.status) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-base-content/60 dark:text-gray-400">
            Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalItems }}
          </div>
          <div class="join">
            <button class="join-item btn btn-sm dark:bg-gray-700 dark:text-white" 
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)">
              Previous
            </button>
            <button v-for="page in totalPages" 
              :key="page"
              :class="[
                'join-item btn btn-sm dark:bg-gray-700 dark:text-white',
                { 'btn-active': currentPage === page }
              ]"
              @click="changePage(page)">
              {{ page }}
            </button>
            <button class="join-item btn btn-sm dark:bg-gray-700 dark:text-white" 
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { UserActivity } from '~/pages/dashboard/types/dashboard.d.ts'

const props = defineProps<{
  activities: UserActivity[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'filter-change', filter: string): void
  (e: 'view-all'): void
}>()

const filter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const tableHeaders = [
  'User',
  'Action',
  'Time',
  'Status'
]

const filteredActivities = computed(() => {
  if (filter.value === 'all') return props.activities
  return props.activities.filter(activity => activity.status === filter.value)
})

const totalItems = computed(() => filteredActivities.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems.value))

const displayedActivities = computed(() => {
  return filteredActivities.value.slice(startIndex.value, endIndex.value)
})

const handleFilterChange = () => {
  currentPage.value = 1
  emit('filter-change', filter.value)
}

const changePage = (page: number) => {
  currentPage.value = page
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const getActionText = (action: string) => {
  const actionTexts: Record<string, string> = {
    post: 'Posted',
    like: 'Liked',
    comment: 'Commented',
    share: 'Shared'
  }
  return actionTexts[action] || action
}

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending'
  }
  return statusTexts[status] || status
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'
}
</script>