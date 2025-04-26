// composables/useNavigation.ts
import { ref, computed } from 'vue';
import { navigateTo } from '#app'; // Nuxt 的導航函數
import type { MenuItem } from '~/composables/IMenu'; // 確保路徑正確
import {
  Home,
  Search, // 用於 Explore 和 Private Content
  Bell,
  MessageCircle,
  Bookmark,
  Settings,
  Lock,
  UserCog,
  User,
  LogOut,
  // 如果其他頁面也用了不同的圖標，可以在這裡添加
} from 'lucide-vue-next';

export function useNavigation() {
  // --- State ---
  const sidebarExpanded = ref(false); // 側邊欄展開狀態，默認 false
  // 當前活動路由的 key，讓使用此 composable 的頁面來設置初始值
  const currentRouteKey = ref('home'); // 默認 'home'

  // --- Navigation Items ---
  const navigationItems = computed<MenuItem[]>(() => [
    { key: 'home', icon: Home, label: 'Home', route: '/main' },
    { key: 'explore', icon: Search, label: 'Search', route: '/explore' },
    { key: 'messages', icon: MessageCircle, label: 'Messages', route: '/PrivateChat' },
    { key: 'notifications', icon: Bell, label: 'Notifications', route: '/notifications' },
    { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks', route: '/bookmarks' },
    { key: 'private', icon: Lock, label: 'Private Content', route: '/Private' } // 添加 Private Content
  ]);

  const bottomItems = computed<MenuItem[]>(() => [
    { key: 'settings', icon: Settings, label: 'Settings', route: '/settings' },
    // 注意：Profile 的路由通常是 /profile，如果你的頁面是 AccountManagement.vue，確保路由匹配
    {key: 'Profile',icon:User,label:"Profile",route:"/user/userProfile"},
    { key: 'Account Management', icon: UserCog, label: 'Account Management', route: '/AccountManagement' }, // 或者 '/profile'
    { key: 'logout', icon: LogOut, label: 'Logout' } // Logout 通常沒有 route，由 handleNavigate 處理
  ]);

  // --- Methods ---
  const logout = () => {
    if (process.client) { // 確保在客戶端執行
      sessionStorage.removeItem('jwt');
      sessionStorage.removeItem('paseto');
      sessionStorage.removeItem('CUUID');
      navigateTo('/login', { replace: true }); // 使用 replace: true 防止用戶回退到登出前的頁面
    }
  };

  const handleNavigate = (item: MenuItem) => {
    if (item.key === 'logout') {
      logout();
    } else if (item.route) {
      currentRouteKey.value = item.key; // 更新視覺上的活動狀態
      navigateTo(item.route);
    } else {
      console.warn(`Navigation item "${item.key}" has no route defined.`);
    }
  };

  // 提供一個方法讓頁面設置當前活動的路由 key
  const setActiveRoute = (key: string) => {
    currentRouteKey.value = key;
  };

  // --- Return ---
  // 返回需要在組件中使用的狀態和方法
  return {
    sidebarExpanded,
    currentRouteKey, // 返回 ref，讓頁面可以讀取和設置
    navigationItems,
    bottomItems,
    handleNavigate,
    setActiveRoute // 讓頁面可以設置初始活動路由
    // logout 不需要單獨返回，因為它被 handleNavigate 調用
  };
}
