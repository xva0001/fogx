<!-- DistributionChart.vue -->
<template>
  <div class="card bg-base-200 dark:bg-gray-800 h-full">
    <div class="card-body p-6">
      <div class="flex justify-between items-center">
        <h2 class="card-title text-base-content dark:text-white">Regional Distribution</h2>
        <select 
          v-model="selectedRegion"
          @change="handleRegionChange"
          class="select select-sm select-bordered dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Regions</option>
          <option value="asia">Asia</option>
          <option value="europe">Europe</option>
          <option value="americas">Americas</option>
        </select>
      </div>

      <div class="mt-6 flex justify-center">
        <!-- Pie Chart -->
        <div class="relative w-80 h-80">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#374151"
              stroke-width="20"
            />
            <template v-for="(segment, index) in pieSegments" :key="index">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="getColor(index)"
                stroke-width="20"
                :stroke-dasharray="`${segment.length} ${100 - segment.length}`"
                :stroke-dashoffset="segment.offset"
                class="transition-all duration-500"
              />
            </template>
          </svg>
          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-base-content dark:text-white">
            <span class="text-2xl font-bold">{{ totalUsers }}</span>
            <span class="text-sm text-base-content/60 dark:text-gray-400">Total Users</span>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="(item, index) in data" 
          :key="item.region" 
          class="flex items-center space-x-2">
          <div :class="['w-3 h-3 rounded-full', getColorClass(index)]"></div>
          <div class="flex-1">
            <div class="flex justify-between text-base-content dark:text-white">
              <span>{{ item.region }}</span>
              <span class="font-semibold">{{ item.percentage }}%</span>
            </div>
            <div class="text-sm text-base-content/60 dark:text-gray-400">
              {{ formatNumber(item.users) }} Users
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RegionalData } from '~/pages/dashboard/types/dashboard.d.ts'

const props = defineProps<{
  data: RegionalData[]
}>()

const emit = defineEmits<{
  (e: 'region-change', region: string): void
}>()

const selectedRegion = ref('all')

const totalUsers = computed(() => {
  return formatNumber(props.data.reduce((sum, item) => sum + item.users, 0))
})

const pieSegments = computed(() => {
  let offset = 25 // Start from 12 o'clock
  return props.data.map(item => {
    const length = item.percentage
    const segment = {
      length,
      offset: -offset
    }
    offset += length
    return segment
  })
})

const handleRegionChange = () => {
  emit('region-change', selectedRegion.value)
}

const getColor = (index: number) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b']
  return colors[index % colors.length]
}

const getColorClass = (index: number) => {
  const classes = ['bg-primary', 'bg-secondary', 'bg-accent']
  return classes[index % classes.length]
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}
</script>