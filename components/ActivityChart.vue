<!-- ActivityChart.vue -->
<template>
  <div class="card bg-base-200">
    <div class="card-body p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="card-title">Activity Overview</h2>
        <select 
          v-model="selectedRange"
          @change="handleRangeChange"
          class="select select-sm select-bordered"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <!-- Chart Area -->
      <div class="relative h-72">
        <!-- Y-Axis Labels -->
        <div class="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-base-content/60 py-2">
          <span v-for="value in yAxisValues" :key="value">
            {{ formatNumber(value) }}
          </span>
        </div>

        <!-- Chart -->
        <div v-if="hasData" class="ml-12 h-full relative">
          <!-- Horizontal Grid Lines -->
          <div class="absolute inset-0 flex flex-col justify-between">
            <div v-for="(_, index) in yAxisValues" 
              :key="index"
              class="border-b border-base-content/10 h-full"
            ></div>
          </div>

          <!-- Data Lines -->
          <svg class="w-full h-full" preserveAspectRatio="none">
            <!-- Active Users Line -->
            <path
              :d="activeUsersPath"
              class="stroke-primary fill-none"
              stroke-width="2"
            />
            <!-- Active Users Area -->
            <path
              :d="activeUsersArea"
              class="fill-primary/10"
            />

            <!-- Posts Line -->
            <path
              :d="postsPath"
              class="stroke-secondary fill-none"
              stroke-width="2"
            />
          </svg>

          <!-- Data Points -->
          <div class="absolute inset-0">
            <div v-for="(point, index) in dataPoints" 
              :key="index"
              class="absolute w-2 h-2 rounded-full bg-primary"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }"
              @mouseenter="showTooltip(point, $event)"
              @mouseleave="hideTooltip"
            ></div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-full">
          <p class="text-base-content/60">No data available</p>
        </div>

        <!-- X-Axis Labels -->
        <div v-if="hasData" class="ml-12 mt-2 flex justify-between text-xs text-base-content/60">
          <span v-for="date in xAxisDates" :key="date">
            {{ formatDate(date) }}
          </span>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex justify-center space-x-6 mt-6">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-primary"></div>
          <span class="text-sm text-base-content/60">Active Users</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-secondary"></div>
          <span class="text-sm text-base-content/60">Posts</span>
        </div>
      </div>

      <!-- Tooltip -->
      <div v-if="tooltip.show"
        class="absolute bg-base-100 shadow-lg rounded-lg p-3 z-10 text-sm"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="font-medium">{{ formatDate(tooltip.date) }}</div>
        <div class="text-base-content/60">
          Active Users: {{ formatNumber(tooltip.users) }}
        </div>
        <div class="text-base-content/60">
          Posts: {{ formatNumber(tooltip.posts) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ActivityData } from '~/pages/dashboard/types/dashboard.d.ts'

const props = withDefaults(defineProps<{
  data?: ActivityData[]
}>(), {
  data: () => []
})

const emit = defineEmits<{
  (e: 'range-change', range: string): void
}>()

// State
const selectedRange = ref('7d')
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  date: '',
  users: 0,
  posts: 0
})

// Computed
const hasData = computed(() => props.data && props.data.length > 0)

const yAxisValues = computed(() => {
  if (!hasData.value) return []
  const maxUsers = Math.max(...props.data.map(d => d.activeUsers))
  const step = Math.ceil(maxUsers / 5)
  return Array.from({ length: 6 }, (_, i) => step * (5 - i))
})

const xAxisDates = computed(() => {
  return props.data?.map(d => d.date) || []
})

const dataPoints = computed(() => {
  if (!hasData.value) return []
  const maxUsers = Math.max(...props.data.map(d => d.activeUsers))
  return props.data.map((d, i) => ({
    x: (i / (props.data.length - 1)) * 100,
    y: ((maxUsers - d.activeUsers) / maxUsers) * 100,
    date: d.date,
    users: d.activeUsers,
    posts: d.posts
  }))
})

const activeUsersPath = computed(() => {
  if (!hasData.value) return ''
  return generatePath(dataPoints.value)
})

const activeUsersArea = computed(() => {
  if (!hasData.value) return ''
  const points = dataPoints.value
  const path = generatePath(points)
  return `${path} L ${points[points.length - 1].x}%, 100% L 0,100% Z`
})

const postsPath = computed(() => {
  if (!hasData.value) return ''
  const maxPosts = Math.max(...props.data.map(d => d.posts))
  const points = props.data.map((d, i) => ({
    x: (i / (props.data.length - 1)) * 100,
    y: ((maxPosts - d.posts) / maxPosts) * 100
  }))
  return generatePath(points)
})

// Methods
function generatePath(points: { x: number, y: number }[]) {
  return points.reduce((path, point, i) => 
    path + `${i === 0 ? 'M' : 'L'} ${point.x}% ${point.y}%`, 
    ''
  )
}

function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function showTooltip(point: any, event: MouseEvent) {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY - 100,
    date: point.date,
    users: point.users,
    posts: point.posts
  }
}

function hideTooltip() {
  tooltip.value.show = false
}

function handleRangeChange() {
  emit('range-change', selectedRange.value)
}
</script>