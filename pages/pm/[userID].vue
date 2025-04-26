<template>
  <div class="min-h-screen" :class="isDark ? 'bg-dark-900' : 'bg-gray-50'">
    <!-- Sidebar -->
    <Sidebar v-model:expanded="sidebarExpanded" :items="navigationItems" :bottom-items="bottomItems"
      :active-key="currentRouteKey" @item-click="handleNavigate" />

    <!-- Main Content Area -->
    <div class="transition-all duration-500" :style="{marginLeft: sidebarExpanded ? '16rem' : '4rem'}">
      <div class="relative">
        <!-- Friend Info Header -->
        <div class="sticky top-0 z-10 p-4 border-b" :class="isDark ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full overflow-hidden">
              <img :src="friend ? friend.icon : ''" alt="Friend avatar" class="w-full h-full object-cover">
            </div>
            <div>
              <h2 class="font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">{{ friend ? friend.name : '' }}</h2>
              <div class="flex items-center">
                <span class="w-2 h-2 rounded-full mr-1" :class="friend && friend.online ? 'bg-green-500' : 'bg-gray-500'"></span>
                <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ friend && friend.online ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="pb-20 pt-4 px-4 space-y-4">
          <div v-for="(message, index) in sortedMessages" :key="index" 
               :class="message.sender === currentUserID ? 'flex justify-end' : 'flex justify-start'">
            <div class="max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3" 
                 :class="message.sender === currentUserID 
                   ? (isDark ? 'bg-blue-600' : 'bg-blue-500 text-white') 
                   : (isDark ? 'bg-dark-700' : 'bg-gray-200')">
              <p>{{ message.content }}</p>
              <p class="text-xs mt-1 text-right" 
                 :class="message.sender === currentUserID 
                   ? (isDark ? 'text-blue-200' : 'text-blue-100') 
                   : (isDark ? 'text-gray-400' : 'text-gray-500')">
                {{ new Date(message.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="fixed bottom-0 p-4 transition-all duration-500"
             :class="isDark ? 'bg-dark-800' : 'bg-white'"
             :style="{left: sidebarExpanded ? '16rem' : '4rem', right: 0}">
          <div class="flex items-center space-x-2">
            <input v-if="inputtedTextImageMsg" v-model="inputtedTextImageMsg.content" 
                   @keyup.enter="sendMsg"
                   class="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500" 
                   :class="isDark ? 'bg-dark-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
                   placeholder="Type a message...">
            <button @click="sendMsg" 
                    class="p-2 rounded-full" 
                    :class="isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600 text-white'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            <button @click="sendCall" 
                    class="p-2 rounded-full" 
                    :class="isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600 text-white'">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Identicon from 'identicon.js';
import { sha3_256 } from 'js-sha3';
import type Peer from 'peerjs';
import type { Friend, Message } from '~/composables/PrivateChatObjectInterface';
import RequestEncryption from '~/shared/Request/requestEncrytion';
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn';
import { useThemeStore } from '~/composables/useThemeStore';
import { useNavigation } from '~/composables/useNavigation';
import { ref, computed } from 'vue';

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark);

const {
  sidebarExpanded,
  currentRouteKey,
  navigationItems,
  bottomItems,
  handleNavigate
} = useNavigation();

const usePeer = await usePeerConnection()
const currentUserID = ref('')
const friend = ref<Friend | null>(null)
const msgList = usePeer.conversations
const sortedMessages = computed<Message[]>(() => {
  return msgList.value
    .flatMap(conv => 
      conv.friendId === friend.value?.id 
        ? conv.listOfMessage 
        : []
    )
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
})
const route = useRoute()
const useCallPeer = usePeerAudioCall(usePeer.peer as Ref<Peer | null>)
const inputtedTextImageMsg = ref<Message|null>(null)
const callMsg = ref<Message|null>(null)

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

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

const setupUserInfo= async ()=>{
    const jwt = sessionStorage.getItem("jwt");
    const paseto = sessionStorage.getItem("paseto");
    if (!jwt || !paseto) {
    navigateTo("/login")
    return
  }

  const userID = Array.isArray(route.params.userID) ? null : route.params.userID;
  if (!userID || !isValidUUID(userID)) {
    navigateTo("/PrivateChat")
    return;
  }

  const fetchedFriend = await fetchFriendInfo(jwt,paseto,userID)

  if (!fetchedFriend) {
    navigateTo("/PrivateChat")
    return;
  }

  const icon = "data:image/png;base64," + new Identicon(sha3_256(fetchedFriend.name), 100).toString();

  fetchedFriend.icon = icon;

  friend.value = fetchedFriend;
}

const initPeerConnection = async () => {
    const jwt = sessionStorage.getItem("jwt");
    const paseto = sessionStorage.getItem("paseto");
    const CUUID = sessionStorage.getItem("CUUID");
    if (!jwt || !paseto || !CUUID) {
        navigateTo("/login");
        return;
    }
    if (usePeer.peer.value !=null) {
        return;
    }
    await usePeer.init({ jwt: jwt, paseto: paseto, CUUID: CUUID })
}

const sendMsg = ()=>{
    if (!friend.value || !inputtedTextImageMsg.value) {
      console.log("no instance");
        return;
    }

    if (inputtedTextImageMsg.value.content.trim()=="" && inputtedTextImageMsg.value.images?.length == 0 ) {
        console.log("nothing here");
        return
    }
    let sent = false
    try {
        const newMsg = {...inputtedTextImageMsg.value, time: new Date().toISOString()};
        usePeer.send(friend.value.id, newMsg);
        
        const existingConvIndex = msgList.value.findIndex(conv => conv.friendId === friend.value?.id);
        if (existingConvIndex >= 0) {
            msgList.value[existingConvIndex].listOfMessage.push(newMsg);
        } else {
            msgList.value.push({
                friendId: friend.value.id,
                listOfMessage: [newMsg]
            });
        }
        
        if (inputtedTextImageMsg.value) {
            inputtedTextImageMsg.value.content = "";
        }
        
        sent = true;
    } catch (e) {
        console.log(e);
    }
    //show msg sent

    //TODO : handle offline msg send , to send (note for future)

    sent = true
}

const sendCall = ()=>{
    if (!friend.value) {
        return
    }
    useCallPeer.call(friend.value.id)    
}

const answerCall = ()=>{
    useCallPeer.answer()
}

const rejectCall = ()=>{
    useCallPeer.reject()   
}

const updateFriendConnectionStatus = (friendrf: Ref<Friend | null>) => {
    const friend = friendrf.value;
    if (!friend) return;
    
    usePeer.connect(friend.id).then(conn => {
        friend.online = true       
    }).catch(() => {
        console.log("friend " + friend.name + " (" + friend.id + ") is offline")
        friend.online = false
    });
    friendrf.value = friend
}

const intervalId = ref<NodeJS.Timeout>();

onMounted(()=>{
    const UUID = sessionStorage.getItem("CUUID")
    if (!UUID || !isValidUUID(UUID) ) {
        navigateTo("/login");
        return;
    }
    currentUserID.value = UUID;

    inputtedTextImageMsg.value = {
        type : "message",
        sender : UUID,
        content : "",
        images : [],
        time : ""
    }

    callMsg.value = {
        type : "volce_call",
        sender :UUID,
        content:"",
        time : "",
        isCall :true
    }
    
    if (usePeer.peer.value) {
        usePeer.peer.value.on("call",(call)=>{
            call.connectionId
        })
    }

    intervalId.value = setInterval(() => {
        if (friend.value && friend) {
            updateFriendConnectionStatus(friend);
        }
    }, 5000);

    setupUserInfo()
    initPeerConnection()
})

onUnmounted(() => {
    if (intervalId.value) {
        clearInterval(intervalId.value);
    }
})
</script>
