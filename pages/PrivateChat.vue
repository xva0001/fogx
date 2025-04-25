<template>
  <div class="min-h-screen relative" :class="isDark ? 'bg-dark-900' : 'bg-gray-50'">
    <!-- Sidebar -->
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRouteKey" @item-click="handleNavigate" />

    <!-- Main Content Area -->
    <div class="transition-all duration-500" :style="{
      marginLeft: sidebarExpanded ? '16rem' : '4rem'
    }">
      <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <!-- Header with Search and Add Friend Button -->
        <div class="flex items-center justify-between mb-8 p-4 rounded-xl" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <div class="search-container group flex-1 max-w-xl">
            <div class="relative flex items-center">
              <input type="text" placeholder="Search friends..." v-model="searchQuery"
                class="w-full px-4 py-2 rounded-full border focus:outline-none focus:border-blue-500"
                :class="isDark ? 'bg-dark border-gray-700 text-gray-300' : 'bg-white border-gray-300'" />
            </div>
          </div>
          <button @click="showAddFriendModal = true"
            class="ml-4 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
            Add Friend
          </button>
        </div>

        <!-- Add Friend Modal -->
        <AddFriendModal :isOpen="showAddFriendModal" @close="showAddFriendModal = false" @submit="handleAddFriend" />

        <!-- Friend List -->
        <div class="rounded-xl shadow-sm p-6" :class="isDark ? 'bg-dark-800' : 'bg-white'">
          <h2 class="text-lg font-semibold mb-4" :class="isDark ? 'text-white' : 'text-gray-800'">Friends</h2>

          <div class="space-y-3">
            <div v-for="friend in filteredFriends" :key="friend.id"
              class="flex items-center p-3 rounded-lg hover:bg-opacity-50 transition duration-200 cursor-pointer"
              :class="isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'" @click="startChat(friend)">
              <div class="w-10 h-10 rounded-full overflow-hidden mr-3">
                <img :src="friend.icon || defaultAvatar" alt="Friend avatar" class="w-full h-full object-cover">
              </div>
              <div class="flex-1">
                <div class="font-medium" :class="isDark ? 'text-white' : 'text-gray-900'">{{ friend.name }}</div>
                <div class="text-sm flex items-center">
                  <span class="mr-2" :class="friend.online ? 'text-green-500' : 'text-gray-500'">
                    {{ friend.online ? 'Online' : 'Offline' }}
                  </span>
                  <span :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                    {{ friend.lastMessage }}
                  </span>
                </div>
              </div>
              <div class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                {{ friend.time }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Friend } from '~/composables/PrivateChatObjectInterface';
import RequestEncryption from '~/shared/Request/requestEncrytion';
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
import { useNavigation } from '~/composables/useNavigation';
import { useThemeStore } from '~/composables/useThemeStore';
import Identicon from 'identicon.js';
import { sha3_256 } from 'js-sha3';
import AddFriendModal from '~/components/AddFriendModal.vue';

// Theme and navigation
const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);
const {
  sidebarExpanded,
  currentRouteKey,
  navigationItems,
  bottomItems,
  handleNavigate
} = useNavigation();

// Friend list and search
const friendList = ref<Friend[]>([]);
const searchQuery = ref('');
const defaultAvatar = "data:image/png;base64," + new Identicon(sha3_256('default'), 100).toString();

const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendList.value;
  return friendList.value.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const showAddFriendModal = ref(false);

const startChat = (friend: Friend) => {
  // TODO: Implement chat initiation
  console.log('Starting chat with', friend.name);
};

const handleAddFriend = (friendId: string) => {
  addFriend(friendId);
};


const fetchFriendInfo = async (jwt: string, paseto: string, friendId: string) => {
  let reqObj = {
    jwt: jwt,
    paseto: paseto,
    friendId: friendId
  }
  let shared: string
  try {
    const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
    const pair = genKeyCurve25519();

    shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));

    const resp = await $fetch("/api/friends/userExists",
      {
        method: "POST",
        body: { ...await RequestEncryption.encryptMessage(JSON.stringify(reqObj), shared), pubkey: pair.getPublic("hex") }
      }
    ).then((res: any) => RequestEncryption.decryptMessage(res.encryptedMessage, shared, res.iv))

    return JSON.parse(resp) as Friend;

  } catch (error) {
    return undefined
  }

}

const loadFriendList = (): string[] => {
  const friendListStr = localStorage.getItem("friendList")
  if (!friendListStr) {
    return [];
  } else {
    return JSON.parse(friendListStr)
  }
}
/**
 * Checks if a string is a valid UUID (including hyphens)
 * @param uuid The string to validate
 * @returns boolean - true if valid UUID format, false otherwise
 */
function isValidUUID(uuid: string): boolean {
  // Regular expression to check UUID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

const initFriendListAndGetData = async () => {

  const jwt = sessionStorage.getItem("jwt")
  const paseto = sessionStorage.getItem("paseto")
  if (!jwt || !paseto) {
    navigateTo("/login")
    return
  }
  const re_problem = []
  const fl = loadFriendList()
  for (let index = 0; index < fl.length; index++) {
    const element = fl[index];
    if (!isValidUUID(element)) {
      re_problem.push(index)
      continue
    }

    const ans = await fetchFriendInfo(jwt, paseto, element)
    if (!ans) {
      console.log(ans);
      continue
    }
    const icon = "data:image/png;base64," + new Identicon(sha3_256(ans.name), 100).toString();
    ans.icon = icon
    friendList.value.push(ans)
  }

  for (let index = 0; index < re_problem.length; index++) {
    fl.splice(re_problem[index], 1)
  }
  sessionStorage.setItem("friendList", JSON.stringify(fl))
}

const addFriend = async (friendId: string) => {

  const jwt = sessionStorage.getItem("jwt");
  const paseto = sessionStorage.getItem("paseto");

  if (!jwt || !paseto) {
    navigateTo("/login");
    return;
  }

  if (!isValidUUID(friendId)) {
    console.error("Invalid friend ID format");
    return;
  }

  const existingFriend = friendList.value.find(friend => friend.id === friendId);
  if (existingFriend) {
    console.log("Friend already exists in the list");
    return;
  }

  const newFriend = await fetchFriendInfo(jwt, paseto, friendId);
  if (!newFriend) {
    console.error("Failed to fetch friend information");
    return;
  }

  friendList.value.push(newFriend);

  const storedFriendList = loadFriendList();
  storedFriendList.push(friendId);
  localStorage.setItem("friendList", JSON.stringify(storedFriendList));

}
//use peer
const usePeer = await usePeerConnection()


const initPeerConnection = async () => {
  const jwt = sessionStorage.getItem("jwt");
  const paseto = sessionStorage.getItem("paseto");
  const CUUID = sessionStorage.getItem("CUUID");
  if (!jwt || !paseto || !CUUID) {
    navigateTo("/login");
    return;
  }
  //connect depandency
  await usePeer.init({ jwt: jwt, paseto: paseto, CUUID: CUUID })

  const fl = friendList
  updateFriendConnectionStatus(fl)
}
const updateFriendConnectionStatus = (friendArr:Ref<Friend[]>)=>{
  for (let index = 0; index < friendArr.value.length; index++) {
    const friend = friendArr.value[index];
    usePeer.connect(friend.id).then(conn => {
      friend.online = true
      conn.on("close",()=>{updateFriendConnectionStatus(friendArr)})
      conn.on("iceStateChanged",()=>{updateFriendConnectionStatus(friendArr)})
    }).catch(() => {
      console.log("friend " + friend.name + " (" + friend.id + ") is offline")
      friend.online = false
    });

  }
}


const connectionStatusTimer = ref<NodeJS.Timeout>()

onMounted(() => {
  initFriendListAndGetData()
  initPeerConnection()
  // Update friend connection status every 30 seconds
  connectionStatusTimer.value = setInterval(() => {
    updateFriendConnectionStatus(friendList)
  }, 15000)
})

onUnmounted(() => {
  if (connectionStatusTimer.value) {
    clearInterval(connectionStatusTimer.value)
  }
})

</script>
