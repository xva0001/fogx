/**
 * Dashboard Data Management Module
 * Provides reactive data and methods for managing dashboard state
 */

import { ref } from 'vue'
import type { DashboardStats, ActivityData, RegionalData, UserActivity } from './Idashboard'

export function useDashboardData() {
  // Loading states
  const loading = ref(false)
  const tableLoading = ref(false)

  // Dashboard data refs
  const stats = ref<DashboardStats>({
    activeUsers: 0,
    activeUsersChange: '+0%',
    activeUsersTrend: 'up',
    newPosts: 0,
    newPostsChange: '+0%',
    newPostsTrend: 'up',
    engagement: 0,
    engagementChange: '+0%',
    engagementTrend: 'up',
    reportedContent: 0,
    reportedContentChange: '+0%',
    reportedContentTrend: 'up'
  })

  const activityData = ref<ActivityData[]>([])
  const regionalData = ref<RegionalData[]>([])
  const activities = ref<UserActivity[]>([])

  /**
   * Fetches dashboard statistics
   */
  async function fetchStats() {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      stats.value = {
        activeUsers: 36254,
        activeUsersChange: '+5.2%',
        activeUsersTrend: 'up',
        newPosts: 5543,
        newPostsChange: '+2.1%',
        newPostsTrend: 'up',
        engagement: 30.56,
        engagementChange: '+1.5%',
        engagementTrend: 'up',
        reportedContent: 123,
        reportedContentChange: '-12.5%',
        reportedContentTrend: 'down'
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches activity data for the specified time range
   * @param timeRange - Time range for data ('7d', '30d', or '90d')
   */
  async function fetchActivityData(timeRange: string = '7d') {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      activityData.value = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toISOString(),
        activeUsers: Math.floor(Math.random() * 10000),
        posts: Math.floor(Math.random() * 1000),
        engagement: Math.random() * 100
      }))
    } catch (error) {
      console.error('Failed to fetch activity data:', error)
    }
  }

  /**
   * Fetches regional distribution data
   * @param region - Region filter ('all', 'asia', 'europe', 'americas')
   */
  async function fetchRegionalData(region: string = 'all') {
    try {
      regionalData.value = [
        { region: 'Asia', users: 15000, percentage: 41.5 },
        { region: 'Europe', users: 12000, percentage: 33.2 },
        { region: 'Americas', users: 9000, percentage: 25.3 }
      ]
    } catch (error) {
      console.error('Failed to fetch regional data:', error)
    }
  }

  /**
   * Fetches user activities
   * @param filter - Activity filter ('all', 'success', 'failed', 'pending')
   */
  async function fetchActivities(filter: string = 'all') {
    tableLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      activities.value = [
        {
          id: '1',
          user: {
            id: '1',
            name: 'John Doe',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=John%20Doe`
          },
          action: 'post',
          targetId: '123',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          user: {
            id: '2',
            name: 'Jane Smith',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Jane%20Smith`
          },
          action: 'comment',
          targetId: '456',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending'
        },
        {
          id: '3',
          user: {
            id: '3',
            name: 'Mike Johnson',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mike%20Johnson`
          },
          action: 'like',
          targetId: '789',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'failed'
        }
      ]
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      tableLoading.value = false
    }
  }

  /**
   * Initializes all dashboard data
   */
  async function initializeData() {
    await Promise.all([
      fetchStats(),
      fetchActivityData(),
      fetchRegionalData(),
      fetchActivities()
    ])
  }

  return {
    // States
    loading,
    tableLoading,
    stats,
    activityData,
    regionalData,
    activities,

    // Methods
    fetchStats,
    fetchActivityData,
    fetchRegionalData,
    fetchActivities,
    initializeData
  }
}