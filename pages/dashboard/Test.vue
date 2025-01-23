<template>

    <div class="min-h-screen bg-base-300">
    
    <!-- 頂部導航欄 -->
    
    <nav class="bg-base-200 shadow-lg">
    
    <div class="px-6 py-3 flex items-center justify-between">
    
    <!-- Logo 區域 -->
    
    <div class="flex items-center pl-2">
    
    <div class="flex items-center space-x-3">
    
    <img src="~/assets/logo/logo_dark.svg" alt="MsgFog" class="h-10 w-10">
    
    <span class="text-xl font-semibold">MsgFog</span>
    
    </div>
    
    </div>
    
    angelscript
    
    Copy
        <!-- 右側按鈕組 -->
        <div class="flex items-center space-x-6">
          <!-- 搜索框 -->
          <div class="relative">
            <input type="text" placeholder="搜索..." v-model="searchQuery"
              class="input input-bordered w-64 pl-10 input-sm bg-base-100">
            <svg class="w-5 h-5 text-base-content/50 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
    
          <div class="flex space-x-3">
            <!-- 通知按鈕 -->
            <button class="btn btn-ghost btn-circle" @click="toggleNotifications">
              <div class="indicator">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span v-if="unreadNotifications" class="badge badge-xs badge-primary indicator-item"></span>
              </div>
            </button>
            
            <!-- 主題切換按鈕 -->
            <button class="btn btn-ghost btn-circle" @click="toggleTheme">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
    
          <div class="divider divider-horizontal"></div>
    
          <!-- 用戶信息 -->
          <div class="flex items-center space-x-3">
            <span class="text-sm">{{ currentUser.name }}</span>
            <button class="btn btn-primary btn-sm" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="flex">
      <!-- 側邊欄 -->
      <div class="w-64 bg-base-200 min-h-screen">
        <ul class="menu menu-lg p-4 space-y-2">
          <li v-for="(item, index) in menuItems" :key="index">
            <a :class="{ 'active': currentRoute === item.route }" @click="navigate(item.route)">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="item.icon"></svg>
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>
    
      <!-- 主要內容區 -->
      <div class="flex-1 p-8">
        <!-- 加載指示器 -->
        <div v-if="loading" class="flex justify-center items-center h-full">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
    
        <div v-else>
          <!-- 頂部統計卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div v-for="(stat, key) in stats" :key="key" class="stat-card">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-base-content/60 text-sm mb-1">{{ stat.label }}</p>
                  <h3 class="text-2xl font-bold">{{ stat.value }}</h3>
                  <p :class="['text-xs mt-2 flex items-center', 
                    stat.trend === 'up' ? 'text-success' : 'text-error']">
                    <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path v-if="stat.trend === 'up'" 
                        stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      <path v-else
                        stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                    </svg>
                    {{ stat.change }} {{ stat.compareText }}
                  </p>
                </div>
                <div :class="[`bg-${stat.color}/10 p-3 rounded-lg`]">
                  <svg class="w-6 h-6" :class="`text-${stat.color}`" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="stat.icon"></svg>
                </div>
              </div>
            </div>
          </div>
    
          <!-- 圖表區域 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="card bg-base-200">
              <div class="card-body">
                <div class="flex justify-between items-center">
                  <h2 class="card-title">收入趨勢</h2>
                  <select v-model="chartFilters.timeRange" 
                    @change="handleTimeRangeChange"
                    class="select select-sm select-bordered">
                    <option v-for="range in timeRanges" :key="range">{{ range }}</option>
                  </select>
                </div>
                <div class="h-[300px] mt-4">
                  <!-- 這裡可以集成實際的圖表組件 -->
                </div>
              </div>
            </div>
    
            <div class="card bg-base-200">
              <div class="card-body">
                <div class="flex justify-between items-center">
                  <h2 class="card-title">地區分布</h2>
                  <select v-model="chartFilters.region" 
                    @change="handleRegionChange"
                    class="select select-sm select-bordered">
                    <option v-for="region in regions" :key="region">{{ region }}</option>
                  </select>
                </div>
                <div class="h-[300px] mt-4">
                  <!-- 這裡可以集成地圖或其他圖表組件 -->
                </div>
              </div>
            </div>
          </div>
    
          <!-- 活動記錄表格 -->
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="flex justify-between items-center mb-6">
                <h2 class="card-title">最近活動</h2>
                <div class="flex space-x-4">
                  <select v-model="activities.filter" 
                    @change="handleStatusFilterChange"
                    class="select select-sm select-bordered">
                    <option v-for="status in statusOptions" :key="status">{{ status }}</option>
                  </select>
                  <button class="btn btn-primary btn-sm" @click="viewAllActivities">查看全部</button>
                </div>
              </div>
              
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="activity in filteredActivities" :key="activity.id">
                      <td>{{ activity.user }}</td>
                      <td>{{ activity.action }}</td>
                      <td>{{ formatDate(activity.time) }}</td>
                      <td>
                        <div :class="[
                          'badge gap-2',
                          {
                            'badge-success': activity.status === 'success',
                            'badge-error': activity.status === 'error',
                            'badge-warning': activity.status === 'processing'
                          }
                        ]">
                          {{ getStatusText(activity.status) }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
    
    </template>
    
    <script>
    
    export default {
    
    name: 'Dashboard',
    
    data() {
    
    return {
    
    loading: false,
    
    searchQuery: '',
    
    currentUser: {
    
    name: 'Admin',
    
    role: 'administrator'
    
    },
    
    unreadNotifications: true,
    
    currentRoute: 'dashboard',
    
    
    // 菜單項配置
    
    menuItems: [
    
    {
    
    label: '概覽',
    
    route: 'dashboard',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />`
    
    },
    
    {
    
    label: '用戶管理',
    
    route: 'users',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`
    
    },
    
    {
    
    label: '活動記錄',
    
    route: 'activities',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`
    
    },
    
    {
    
    label: '系統設置',
    
    route: 'settings',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />`
    
    }
    
    ],
    
    // 統計卡片數據
    
    stats: {
    
    customers: {
    
    label: '客戶數量',
    
    value: '36,254',
    
    change: '+1.25%',
    
    trend: 'up',
    
    compareText: '相比上月',
    
    color: 'primary',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />`
    
    },
    
    orders: {
    
    label: '訂單數量',
    
    value: '5,543',
    
    change: '+2.5%',
    
    trend: 'up',
    
    compareText: '相比上週',
    
    color: 'secondary',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />`
    
    },
    
    revenue: {
    
    label: '收入',
    
    value: '$58,254',
    
    change: '-0.5%',
    
    trend: 'down',
    
    compareText: '相比昨天',
    
    color: 'accent',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
    
    },
    
    conversion: {
    
    label: '轉換率',
    
    value: '30.56%',
    
    change: '+4.35%',
    
    trend: 'up',
    
    compareText: '相比上週',
    
    color: 'info',
    
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    
    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`
    
    }
    
    },
    
    // 圖表相關
    
    chartFilters: {
    
    timeRange: '最近7天',
    
    region: '所有地區'
    
    },
    
    timeRanges: ['最近7天', '最近30天', '最近90天'],
    
    regions: ['所有地區', '亞洲', '歐洲', '美洲'],
    
    // 活動記錄
    
    activities: {
    
    filter: '所有狀態',
    
    list: [
    
    {
    
    id: 1,
    
    user: 'John Doe',
    
    action: '登入系統',
    
    time: '2025-01-13 14:30:00',
    
    status: 'success'
    
    },
    
    {
    
    id: 2,
    
    user: 'Jane Smith',
    
    action: '更新個人資料',
    
    time: '2025-01-13 13:45:00',
    
    status: 'success'
    
    },
    
    {
    
    id: 3,
    
    user: 'Bob Johnson',
    
    action: '嘗試訪問管理頁面',
    
    time: '2025-01-13 12:20:00',
    
    status: 'error'
    
    },
    
    {
    
    id: 4,
    
    user: 'Alice Brown',
    
    action: '導出報表',
    
    time: '2025-01-13 11:15:00',
    
    status: 'processing'
    
    },
    
    {
    
    id: 5,
    
    user: 'Charlie Wilson',
    
    action: '修改系統設置',
    
    time: '2025-01-13 10:00:00',
    
    status: 'success'
    
    }
    
    ]
    
    },
    
    statusOptions: ['所有狀態', '成功', '失敗', '處理中'],
    
    tableHeaders: ['用戶', '活動', '時間', '狀態']
    
    }
    
    },
    
    computed: {
    
    filteredActivities() {
    
    if (this.activities.filter === '所有狀態') return this.activities.list
    
    
    const statusMap = {
    
    '成功': 'success',
    
    '失敗': 'error',
    
    '處理中': 'processing'
    
    }
    
    
    return this.activities.list.filter(
    
    activity => activity.status === statusMap[this.activities.filter]
    
    )
    
    }
    
    },
    
    methods: {
    
    // UI 交互方法
    
    toggleNotifications() {
    
    this.unreadNotifications = !this.unreadNotifications
    
    },
    
    toggleTheme() {
    
    // 實現主題切換邏輯
    
    },
    
    navigate(route) {
    
    this.currentRoute = route
    
    // 實現路由導航
    
    },
    
    logout() {
    
    // 實現登出邏輯
    
    },
    
    viewAllActivities() {
    
    // 實現查看所有活動的邏輯
    
    },
    
    // 數據格式化方法
    
    formatDate(dateString) {
    
    const date = new Date(dateString)
    
    return date.toLocaleString('zh-TW', {
    
    year: 'numeric',
    
    month: '2-digit',
    
    day: '2-digit',
    
    hour: '2-digit',
    
    minute: '2-digit'
    
    })
    
    },
    
    getStatusText(status) {
    
    const statusMap = {
    
    success: '成功',
    
    error: '失敗',
    
    processing: '處理中'
    
    }
    
    return statusMap[status]
    
    },
    
    // API 相關方法
    
    async fetchStats() {
    
    this.loading = true
    
    try {
    
    // const response = await api.getStats()
    
    // this.stats = response.data
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模擬加載
    
    } catch (error) {
    
    console.error('Failed to fetch stats:', error)
    
    } finally {
    
    this.loading = false
    
    }
    
    },
    
    async fetchChartData() {
    
    try {
    
    // const response = await api.getChartData(this.chartFilters)
    
    // 處理圖表數據
    
    } catch (error) {
    
    console.error('Failed to fetch chart data:', error)
    
    }
    
    },
    
    async fetchActivities() {
    
    try {
    
    // const response = await api.getActivities(this.activities.filter)
    
    // this.activities.list = response.data
    
    } catch (error) {
    
    console.error('Failed to fetch activities:', error)
    
    }
    
    },
    
    // 篩選器處理方法
    
    async handleTimeRangeChange() {
    
    await this.fetchChartData()
    
    },
    
    async handleRegionChange() {
    
    await this.fetchChartData()
    
    },
    
    async handleStatusFilterChange() {
    
    await this.fetchActivities()
    
    }
    
    },
    
    async created() {
    
    // 初始加載數據
    
    await Promise.all([
    
    this.fetchStats(),
    
    this.fetchChartData(),
    
    this.fetchActivities()
    
    ])
    
    }
    
    }
    
    </script>
    
    <style>
    
    .stat-card {
    
    @apply card bg-base-200 p-6 transition-all duration-300 hover:translate-y-[-2px];
    
    }
    
    </style>