export interface DashboardStats {
  activeUsers: number
  activeUsersChange: string
  activeUsersTrend: 'up' | 'down'
  newPosts: number
  newPostsChange: string
  newPostsTrend: 'up' | 'down'
  engagement: number
  engagementChange: string
  engagementTrend: 'up' | 'down'
  reportedContent: number
  reportedContentChange: string
  reportedContentTrend: 'up' | 'down'
}

export interface ActivityData {
  date: string
  activeUsers: number
  posts: number
  engagement: number
}

export interface RegionalData {
  region: string
  users: number
  percentage: number
}

export interface UserActivity {
  id: string
  user: {
    id: string
    name: string
    avatar: string
  }
  action: 'post' | 'like' | 'comment' | 'share'
  targetId: string
  timestamp: string
  status: 'success' | 'failed' | 'pending'
}
