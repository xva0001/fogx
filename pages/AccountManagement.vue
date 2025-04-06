<template>
  <div class="min-h-screen relative" :class="isDark ? 'bg-dark-900' : 'bg-gray-50'">
    <!-- Avatar Cropper Modal -->
    <div v-if="showCropper" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-dark-800 rounded-lg p-4 max-w-md w-full h-100">
        <h3 class="text-lg font-bold mb-4">Crop Avatar</h3>
        <Cropper ref="cropper" class="cropper" :src="avatarToCrop" :stencil-props="{
          aspectRatio: 1 / 1,
          handlers: {},
          movable: false,
          resizable: false
        }" :default-boundaries="'fit'" :auto-zoom="true" :min-width="128" :min-height="128"
          image-restriction="stencil" />
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="showCropper = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-700">
            Cancel
          </button>
          <button @click="cropAvatar" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Crop & Save
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRoute" @item-click="handleNavigate" />

    <!-- Main content area -->
    <div class="transition-all duration-500" :style="{
      marginLeft: sidebarExpanded ? '16rem' : '4rem'
    }">
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <!-- Top action bar -->
        <div class="flex items-center justify-between mb-8 p-4 rounded-xl" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <h1 class="text-xl font-bold" :class="isDark ? 'text-gray-200' : 'text-gray-800'">Account Management</h1>

          <!-- Action buttons -->
          <div class="flex items-center space-x-6 ml-4">
            <button class="btn btn-ghost btn-circle">
              <Bell class="h-5 w-5" />
            </button>
            <!-- Theme toggle button -->
            <button class="btn btn-ghost btn-circle" @click="toggleTheme">
              <component :is="isDark ? Sun : Moon" class="h-5 w-5" />
            </button>

            <div class="divider divider-horizontal"></div>
            <!-- User info -->
            <div class="flex items-center space-x-3">
              <span class="text-sm">{{ user.username }}</span>
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                <img :src="user.icon" alt="" class="w-full h-full object-cover">
              </div>

            </div>
          </div>
        </div>

        <!-- Personal information card -->
        <div class="rounded-xl shadow-sm" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="p-6">
            <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
              Basic Information
            </h2>
            <div class="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
              <!-- Avatar section -->
              <div class="flex flex-col items-center space-y-2">
                <div class="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center  overflow-hidden">
                  <!-- <span class="text-3xl text-white font-bold">{{ user.icon }}</span> -->
                  <img :src="user.icon" alt="" srcset="">
                </div>
                <input type="file" id="avatar-upload" accept="image/*" class="hidden" @change="handleAvatarUpload">
                <label for="avatar-upload"
                  class="px-3 py-1 text-sm rounded-md text-blue-500 border border-blue-500 hover:bg-blue-50 hover:bg-opacity-20 cursor-pointer">
                  Change Avatar
                </label>
              </div>

              <!-- Personal information form -->
              <div class="flex-1 w-full md:w-auto">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                      Username
                    </label>
                    <input v-model="user.username" type="text"
                      class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                      Email
                    </label>
                    <input v-model="user.email" type="email"
                      class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>
                  <div class="flex justify-end">
                    <button @click="saveProfile"
                      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security settings card -->
        <div class="rounded-xl shadow-sm" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="p-6">
            <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
              <div class="flex items-center">
                <Shield class="h-5 w-5 mr-2" />
                Security Settings
              </div>
            </h2>

            <div class="space-y-6">
              <!-- Change password section -->
              <div>
                <h3 class="text-md font-medium mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Change Password
                </h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                      Current Password
                    </label>
                    <input v-model="passwordForm.current" type="password"
                      class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>
                  <div>
                    <label class="block text-sm mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                      New Password
                    </label>
                    <input v-model="passwordForm.new" type="password"
                      class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>
                  <div>
                    <label class="block text-sm mb-1" :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                      Confirm New Password
                    </label>
                    <input v-model="passwordForm.confirm" type="password"
                      class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-blue-500"
                      :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
                  </div>
                  <div class="flex justify-end">
                    <button @click="changePassword"
                      class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                      :disabled="!canChangePassword">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>

              <!-- Two-factor authentication section -->
              <div class="pt-4 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Two-Factor
                      Authentication</h3>
                    <p class="text-sm mt-1" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      Add an extra layer of security with app or SMS verification
                    </p>
                  </div>
                  <div class="flex items-center">
                    <span class="text-sm mr-2" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                      {{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                    </span>
                    <button class="relative inline-flex items-center h-6 rounded-full w-11"
                      :class="user.twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-400'" @click="toggleTwoFactor">
                      <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                        :class="user.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Login activity section -->
              <div class="pt-4 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <h3 class="text-md font-medium mb-3" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Reset 2FA Key
                </h3>
                <div class="space-y-3">
                  <!-- <div v-for="(session, index) in recentSessions" :key="index"
                       class="flex items-center justify-between p-3 rounded-md"
                       :class="isDark ? 'bg-dark-700' : 'bg-gray-50'">
                    <div class="flex items-center">
                      <Smartphone v-if="session.device === 'mobile'" class="h-5 w-5 mr-3" />
                      <Monitor v-else class="h-5 w-5 mr-3" />
                      <div>
                        <p class="text-sm font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">
                          {{ session.deviceName }}
                        </p>
                        <p class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                          {{ session.location }} · {{ session.time }}
                        </p>
                      </div>
                    </div>
                    <div>
                      <button v-if="session.current" class="text-xs px-2 py-1 rounded bg-green-500 text-white">
                        Current Device
                      </button>
                      <button v-else class="text-xs text-red-500 hover:underline">
                        Sign Out
                      </button>
                    </div>
                  </div> -->
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy settings card -->
        <div class="rounded-xl shadow-sm" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="p-6">
            <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
              <div class="flex items-center">
                <Eye class="h-5 w-5 mr-2" />
                Privacy Settings
              </div>
            </h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Profile Visibility
                  </h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Control who can view your
                    profile</p>
                </div>
                <select v-model="privacySettings.profileVisibility" class="select select-bordered text-sm"
                  :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'">
                  <option value="public">Everyone</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div class="flex items-center justify-between pt-3 border-t"
                :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Search Visibility
                  </h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Control whether other users can
                    find you in search</p>
                </div>
                <button class="relative inline-flex items-center h-6 rounded-full w-11"
                  :class="privacySettings.searchable ? 'bg-blue-500' : 'bg-gray-400'"
                  @click="privacySettings.searchable = !privacySettings.searchable">
                  <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                    :class="privacySettings.searchable ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>

              <div class="flex items-center justify-between pt-3 border-t"
                :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Read Receipts</h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Allow others to see when you've
                    read their messages</p>
                </div>
                <button class="relative inline-flex items-center h-6 rounded-full w-11"
                  :class="privacySettings.readReceipts ? 'bg-blue-500' : 'bg-gray-400'"
                  @click="privacySettings.readReceipts = !privacySettings.readReceipts">
                  <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                    :class="privacySettings.readReceipts ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>

              <div class="flex justify-end mt-4">
                <button @click="savePrivacySettings"
                  class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
                  Save Privacy Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification settings card -->
        <div class="rounded-xl shadow-sm" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="p-6">
            <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-gray-200' : 'text-gray-800'">
              <div class="flex items-center">
                <Bell class="h-5 w-5 mr-2" />
                Notification Settings
              </div>
            </h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Email
                    Notifications</h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Receive emails about important
                    updates and activity</p>
                </div>
                <button class="relative inline-flex items-center h-6 rounded-full w-11"
                  :class="notificationSettings.email ? 'bg-blue-500' : 'bg-gray-400'"
                  @click="notificationSettings.email = !notificationSettings.email">
                  <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                    :class="notificationSettings.email ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>

              <div class="flex items-center justify-between pt-3 border-t"
                :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">New Message
                    Notifications</h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Get notified when you receive
                    new messages</p>
                </div>
                <button class="relative inline-flex items-center h-6 rounded-full w-11"
                  :class="notificationSettings.messages ? 'bg-blue-500' : 'bg-gray-400'"
                  @click="notificationSettings.messages = !notificationSettings.messages">
                  <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                    :class="notificationSettings.messages ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>

              <div class="flex items-center justify-between pt-3 border-t"
                :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <div>
                  <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">New Follower
                    Notifications</h3>
                  <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Get notified when someone
                    follows you</p>
                </div>
                <button class="relative inline-flex items-center h-6 rounded-full w-11"
                  :class="notificationSettings.followers ? 'bg-blue-500' : 'bg-gray-400'"
                  @click="notificationSettings.followers = !notificationSettings.followers">
                  <span class="absolute h-4 w-4 rounded-full bg-white transition transform"
                    :class="notificationSettings.followers ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>

              <div class="flex justify-end mt-4">
                <button @click="saveNotificationSettings"
                  class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger zone card -->
        <div class="rounded-xl shadow-sm" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="p-6">
            <h2 class="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>

            <div class="space-y-4">
              <div class="pb-4 border-b" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                <h3 class="text-md font-medium" :class="isDark ? 'text-gray-300' : 'text-gray-700'">Export Data</h3>
                <p class="text-sm mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  Download all your data, including personal information, messages, and other content
                </p>
                <button
                  class="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 hover:bg-opacity-20 focus:outline-none">
                  Export Data
                </button>
              </div>

              <div class="pt-2">
                <h3 class="text-md font-medium text-red-500 mb-1">Delete Account</h3>
                <p class="text-sm mb-3" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button @click="confirmAccountDeletion = true"
                  class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none">
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete account confirmation modal -->
    <div v-if="confirmAccountDeletion"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="relative bg-white dark:bg-dark-800 rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-bold mb-4 text-red-500">Confirm Account Deletion</h3>
        <p class="mb-4 text-gray-700 dark:text-gray-300">This action will permanently delete your account and all data.
          This cannot be recovered.</p>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Please enter your password to confirm:
          </label>
          <input v-model="deleteAccountPassword" type="password"
            class="w-full px-4 py-2 rounded-md border focus:outline-none focus:border-red-500"
            :class="isDark ? 'bg-dark-700 border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
        </div>

        <div class="flex space-x-3 justify-end">
          <button @click="confirmAccountDeletion = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-700 focus:outline-none">
            Cancel
          </button>
          <button @click="deleteAccount"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
            :disabled="!deleteAccountPassword">
            Confirm Deletion
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import {
  Bell,
  Sun,
  Moon,
  Home,
  Search,
  MessageCircle,
  Bookmark,
  Settings,
  User,
  LogOut,
  Shield,
  Eye,
  Smartphone,
  Monitor
} from 'lucide-vue-next';
import type { MenuItem } from '~/composables/IMenu';
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
import RequestEncryption from '~/shared/Request/requestEncrytion';
import Identicon from "identicon.js"
import { sha3_256 } from 'js-sha3';


const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const sidebarExpanded = ref(true);
const currentRoute = ref('profile');
const confirmAccountDeletion = ref(false);
const deleteAccountPassword = ref('');
const showCropper = ref(false);
const avatarToCrop = ref('');
const cropper = ref<InstanceType<typeof Cropper>>();

// Navigation menu items
const navigationItems = computed<MenuItem[]>(() => [
  {
    key: 'home',
    icon: Home,
    label: 'Home',
    route: '/'
  },
  {
    key: 'explore',
    icon: Search,
    label: 'Explore',
    route: '/explore'
  },
  {
    key: 'messages',
    icon: MessageCircle,
    label: 'Messages',
    route: '/messages'
  },
  {
    key: 'notifications',
    icon: Bell,
    label: 'Notifications',
    route: '/notifications'
  },
  {
    key: 'bookmarks',
    icon: Bookmark,
    label: 'Bookmarks',
    route: '/bookmarks'
  }
]);

const bottomItems = computed<MenuItem[]>(() => [
  {
    key: 'settings',
    icon: Settings,
    label: 'Settings',
    route: '/settings'
  },
  {
    key: 'profile',
    icon: User,
    label: 'Profile',
    route: '/profile'
  },
  {
    key: 'logout',
    icon: LogOut,
    label: 'Logout'
  }
]);

// User data
const user = ref({
  icon: '',
  username: '',
  email: '',
  twoFactorEnabled: true
});

let orgUser = {
  icon: '',
  username: '',
  email: '',
  twoFactorEnabled: true
}

// Handle avatar upload
const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    if (e.target?.result) {
      avatarToCrop.value = e.target.result as string;
      showCropper.value = true;
    }
  };
  reader.readAsDataURL(file);
};

const cropAvatar = async () => {
  if (!cropper.value) return;

  try {
    const { canvas } = cropper.value.getResult();
    if (!canvas) throw new Error('Failed to create canvas');

    // Create circular mask
    const circularCanvas = document.createElement('canvas');
    circularCanvas.width = 256;
    circularCanvas.height = 256;
    const ctx = circularCanvas.getContext('2d');

    if (ctx) {
      ctx.beginPath();
      ctx.arc(128, 128, 128, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0, 256, 256);
    }

    user.value.icon = circularCanvas.toDataURL('image/jpeg', 0.9);
    showCropper.value = false;
  } catch (error) {
    console.error('Avatar crop failed:', error);
    alert('Failed to crop image. Please try again.');
  }
};

// Password form
const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
});

// Privacy settings
const privacySettings = ref({
  profileVisibility: 'public',
  searchable: true,
  readReceipts: true
});

// Notification settings
const notificationSettings = ref({
  email: true,
  messages: true,
  followers: true
});

// Recent login sessions
const recentSessions = ref<any[]>([]);

// Computed properties
const canChangePassword = computed(() => {
  return passwordForm.value.current &&
    passwordForm.value.new &&
    passwordForm.value.confirm &&
    passwordForm.value.new === passwordForm.value.confirm;
});

// Handle navigation
const handleNavigate = (item: MenuItem) => {
  if (item.key === 'logout') {
    // Handle logout logic
    logout();
    return;
  }
  currentRoute.value = item.key;
  // Handle navigation
  console.log('Navigating to:', item.route);
};

// Theme toggle
const toggleTheme = () => {
  if (process.client) {
    isDark.value = !isDark.value;
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light';
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  }
};

// Two-factor authentication toggle
const toggleTwoFactor = () => {
  // 在實際應用中，這應該調用API來啟用/禁用2FA
  // 由於系統要求2FA，這個功能可能需要禁用或進行特殊處理
  alert('系統需要啟用兩因素認證，無法禁用此功能');
  user.value.twoFactorEnabled = true;
};

// Save profile
const saveProfile = async () => {
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    let servPubKey = await $fetch("/api/ECDHpubkey")

    //gen key
    let pair = genKeyCurve25519()
    //calculate shared key
    let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    if (!jwt || !paseto) {
      alert('您需要重新登入');
      navigateTo('/login');
      return;
    }
    // Prepare data packet with only modified fields
    const packet: Record<string, any> = {
      jwt,
      paseto
    };

    // Only include username if changed and not empty
    if (user.value.username && user.value.username.trim() !== '' && user.value.username != orgUser.username) {
      packet.username = user.value.username;
    }

    // Only include email if changed and valid
    if (user.value.email && user.value.email.trim() !== '' && user.value.email != orgUser.email) {
      packet.email = user.value.email;
    }

    // Handle avatar image if changed
    if (user.value.icon && user.value.icon.startsWith('data:image') && user.value.icon != orgUser.icon) {
      // Convert to base64 without data URL prefix if needed
      const base64Data = user.value.icon.split(',')[1] || user.value.icon;
      packet.icon = base64Data;
    }

    const encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared);
    encrypt.pubkey = pair.getPublic("hex");

    const response: any = await $fetch('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    });
    //console.log(response);


    if (response.success) {
      alert('個人資料更新成功！');
    } else {
      alert('更新失敗: ' + (response.message || '未知錯誤'));
    }
  } catch (error: any) {
    console.error('Failed to save profile:', error);
    alert('更新失敗: ' + (error.message || '未知錯誤'));
  }
};

// Change password
const changePassword = async () => {
  if (!canChangePassword.value) return;

  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');
    const CUUID = sessionStorage.getItem("CUUID")
    //
    // if (!jwt || !paseto) {
    //   alert('您需要重新登入');
    //   navigateTo('/login');
    //   return;
    // }

    const { sha3_256, sha3_384 } = await import('js-sha3');

    let packet = {
      old_hash3_256_password: sha3_256(passwordForm.value.current),
      old_hash384_password: sha3_384(passwordForm.value.current),
      new_hash3_256_password: sha3_256(passwordForm.value.new),
      new_hash384_password: sha3_384(passwordForm.value.new),
      CUUID: CUUID,
      jwt: jwt,
      paseto: paseto
    }
    let servPubKey = await $fetch("/api/ECDHpubkey")
    //gen key
    let pair = genKeyCurve25519()
    //calculate shared key
    let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    //        console.log(shared);

    let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)

    encrypt["pubkey"] = pair.getPublic("hex")


    // 呼叫API更改密碼
    const response: any = await $fetch('/api/user/password', {
      method: 'POST',
      body: JSON.stringify(encrypt)
    });

    if (response.success) {
      alert('密碼更改成功！');
      // 清除表單
      passwordForm.value = {
        current: '',
        new: '',
        confirm: ''
      };
    } else {
      alert('密碼更改失敗: ' + (response.message || '未知錯誤'));
    }
  } catch (error: any) {
    console.error('Failed to change password:', error);
    alert('密碼更改失敗: ' + (error.message || '未知錯誤'));
  }
};

// Save privacy settings
const savePrivacySettings = async () => {
  console.log('Saving privacy settings:', privacySettings.value);
  // This should call an API to save privacy settings
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Privacy settings saved!');
  } catch (error) {
    console.error('Failed to save privacy settings:', error);
    alert('Failed to save, please try again');
  }
};

// Save notification settings
const saveNotificationSettings = async () => {
  console.log('Saving notification settings:', notificationSettings.value);
  // This should call an API to save notification settings
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert('Notification settings saved!');
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    alert('Failed to save, please try again');
  }
};

// Delete account
const deleteAccount = async () => {
  if (!deleteAccountPassword.value) return;

  console.log('Deleting account');
  // This should call an API to delete account
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');

    let servPubKey = await $fetch("/api/ECDHpubkey")
    //gen key
    let pair = genKeyCurve25519()
    //calculate shared key
    let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    //        console.log(shared);

    let packet = {
      jwt: jwt,
      paseto: paseto
    }

    let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)
    encrypt["pubkey"] = pair.getPublic("hex")

    const response: any = await $fetch("/api/user/UserDeleteAccount", {
      method: "POST",
      body: JSON.stringify(encrypt)
    })

    if (response.success) {
      sessionStorage.clear()
      navigateTo({ path: "/", replace: true })
    } else {
      throw new Error("Delete fail, bankend error")
    }
  } catch (error) {
    console.error('Failed to delete account:', error);
    alert('Failed to delete account, please confirm your password and try again');
  }
};

// Logout function
const logout = () => {
  // Clear session storage
  sessionStorage.removeItem('CUUID');
  sessionStorage.removeItem('jwt');
  sessionStorage.removeItem('paseto');
  // Redirect to login page
  navigateTo({path:'/login',replace:true});
};

// Fetch user data
const fetchUserData = async () => {
  try {
    const jwt = sessionStorage.getItem('jwt');
    const paseto = sessionStorage.getItem('paseto');

    if (!jwt || !paseto) {
      console.error('Authentication tokens not found');
      navigateTo('/login');
      return;
    }
    let packet = {
      jwt: jwt,
      paseto: paseto
    }
    let servPubKey = await $fetch("/api/ECDHpubkey")
    //gen key
    let pair = genKeyCurve25519()
    //calculate shared key
    let shared = calSharedKey(servPubKey.pubkey, pair.getPrivate("hex"))

    //        console.log(shared);

    let encrypt: any = await RequestEncryption.encryptMessage(JSON.stringify(packet), shared)

    encrypt["pubkey"] = pair.getPublic("hex")

    //console.log(encrypt);


    let response: any = await $fetch('/api/user/profileget', {
      method: "POST",
      body: JSON.stringify(encrypt)
    }).then((res: any) => RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv));
    // console.log(response);
    // console.log(typeof response);
    response = JSON.parse(response)
    //response = 
    if (response.success && response.user) {
      //console.log(response);
      console.log(response);
      if (response.user.icon == null) {
        //response.user.username
        response.user.icon = new Identicon(sha3_256(response.user.username), 100).toString()
        //data:image/png;base64,

      }
      response.user.icon = "data:image/png;base64," + response.user.icon
      Object.assign(user.value, response.user);
      Object.assign(orgUser, response.user);


      // Also fetch other data, such as recent login sessions
    } else {
      console.error('Failed to fetch user data');
    }
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    // If it's authentication issue, redirect to login page
    if (error.statusCode === 401) {
      navigateTo('/login');
    }
  }
};

onMounted(() => {
  // Initialize theme
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    isDark.value = savedTheme === 'dark';
    document.documentElement.dataset.theme = savedTheme;
  }

  // Fetch user data from backend
  fetchUserData();
});
</script>
