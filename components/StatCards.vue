<!-- StatCards.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Active Users -->
    <div class="card bg-primary text-primary-content">
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h2 class="card-title">Active Users</h2>
          <Users class="w-6 h-6 opacity-80" />
        </div>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-3xl font-bold">{{ formatNumber(stats.activeUsers) }}</p>
            <p class="text-sm opacity-80 flex items-center">
              <TrendingUp v-if="stats.activeUsersTrend === 'up'" class="w-4 h-4 mr-1" />
              <TrendingDown v-else class="w-4 h-4 mr-1" />
              vs last month {{ stats.activeUsersChange }}
            </p>
          </div>
          <div :class="[
            'badge badge-lg',
            stats.activeUsersTrend === 'up' ? 'badge-success' : 'badge-error'
          ]">
            {{ stats.activeUsersTrend === 'up' ? '↑' : '↓' }}
          </div>
        </div>
      </div>
    </div>

    <!-- New Posts -->
    <div class="card bg-secondary text-secondary-content">
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h2 class="card-title">New Posts</h2>
          <FileText class="w-6 h-6 opacity-80" />
        </div>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-3xl font-bold">{{ formatNumber(stats.newPosts) }}</p>
            <p class="text-sm opacity-80 flex items-center">
              <TrendingUp v-if="stats.newPostsTrend === 'up'" class="w-4 h-4 mr-1" />
              <TrendingDown v-else class="w-4 h-4 mr-1" />
              vs last month {{ stats.newPostsChange }}
            </p>
          </div>
          <div :class="[
            'badge badge-lg',
            stats.newPostsTrend === 'up' ? 'badge-success' : 'badge-error'
          ]">
            {{ stats.newPostsTrend === 'up' ? '↑' : '↓' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Engagement Rate -->
    <div class="card bg-accent text-accent-content">
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h2 class="card-title">Engagement Rate</h2>
          <BarChart2 class="w-6 h-6 opacity-80" />
        </div>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-3xl font-bold">{{ stats.engagement }}%</p>
            <p class="text-sm opacity-80 flex items-center">
              <TrendingUp v-if="stats.engagementTrend === 'up'" class="w-4 h-4 mr-1" />
              <TrendingDown v-else class="w-4 h-4 mr-1" />
              vs last month {{ stats.engagementChange }}
            </p>
          </div>
          <div :class="[
            'badge badge-lg',
            stats.engagementTrend === 'up' ? 'badge-success' : 'badge-error'
          ]">
            {{ stats.engagementTrend === 'up' ? '↑' : '↓' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Reported Content -->
    <div class="card bg-neutral text-neutral-content">
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h2 class="card-title">Reported Content</h2>
          <AlertTriangle class="w-6 h-6 opacity-80" />
        </div>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-3xl font-bold">{{ formatNumber(stats.reportedContent) }}</p>
            <p class="text-sm opacity-80 flex items-center">
              <TrendingUp v-if="stats.reportedContentTrend === 'up'" class="w-4 h-4 mr-1" />
              <TrendingDown v-else class="w-4 h-4 mr-1" />
              vs last month {{ stats.reportedContentChange }}
            </p>
          </div>
          <div :class="[
            'badge badge-lg',
            stats.reportedContentTrend === 'up' ? 'badge-error' : 'badge-success'
          ]">
            {{ stats.reportedContentTrend === 'up' ? '↑' : '↓' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Users, FileText, BarChart2, AlertTriangle,
  TrendingUp, TrendingDown 
} from 'lucide-vue-next'
import type { DashboardStats } from '~/pages/dashboard/types/dashboard.d.ts'

defineProps<{
  stats: DashboardStats
}>()

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num)
}
</script>