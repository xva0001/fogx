<template>
  <div>
    <header class="p-4 flex justify-between items-center"
      :class="isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'">
      <NuxtImg :src="isDark ? dark_logo : logo" alt="Logo" class="w-20 h-20 mb-2"
        :class="isDark ? 'text-white' : 'text-black'">
      </NuxtImg>
      <ul class="flex gap-4">
        <li v-for="(item, index) in navItems" :key="index">
          <nuxt-link :to="item.link" class="hover:text-gray-400">{{ item.text }}</nuxt-link>
        </li>
        <li><nuxt-link @click="GoToLogin"
            class=" btn-accent btn-active text-white px-4 py-2 rounded hover:bg-blue-600">Login</nuxt-link></li>
        <li>
          <DarkModeBtn class="p-0" />
        </li>
      </ul>
    </header>

    <section class="hero text-center py-16" :class="isDark ? 'bg-gray-600 text-white' : 'bg-gray-100 text-black'">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">Connect Securely, Share Freely</h1>
        <p class="text-lg mb-6">
          Your privacy is our priority. MsgFog ensures your conversations remain
          confidential and secure.
        </p>
        <div class="flex justify-center gap-4 mt-6">
          <nuxt-link class="btn btn-neutral" :class="isDark ? '' : ' text-white'">
            Join Now

          </nuxt-link>
          <nuxt-link  @click="GoToLogin" class="btn btn-active btn-accent  text-white">
            Login
          </nuxt-link>
        </div>
      </div>
    </section>

    <section id="features" class="py-12" :class="isDark ? ' text-white ' : ' text-black'">
  <h2 class="text-3xl font-bold text-center mb-8" :class="isDark ? 'text-gray-200' : 'text-white'">
    Why Choose MsgFog?
  </h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-3"> 
    <div v-for="(feature, index) in features" :key="index" class="flex flex-col items-center justify-center p-4 shadow-md rounded-md text-center" :class="isDark ? 'bg-zinc-600' : 'bg-white'">
      <Icon :name="feature.icon" class="w-20 h-20" />
      <h3 class="text-xl font-semibold mb-2">{{ feature.title }}</h3>
      <p>{{ feature.description }}</p>
    </div>
  </div>
</section>


    <section id="about" class="py-12 text-center"
      :class="isDark ? ' text-white bg-gray-800' : ' text-black bg-gray-100 '">
      <h2 class="text-3xl font-bold mb-4">About MsgFog</h2>
      <p class=" items-center mx-3">MsgFog is built for those who value privacy and secure communication. Our platform
        combines cutting-edge technology with a user-friendly experience to keep your conversations safe.</p>
      <p>Thank you for other 3 teammates cooperation.</p>
    </section>

    <section id="contact" class="py-12 text-center"
      :class="isDark ? ' text-white bg-gray-800' : ' text-black bg-gray-200'">
      <h2 class="text-3xl font-bold mb-4">Contact us</h2>

      <!-- Loop through social media links using v-for -->
      <div class="flex justify-center gap-6">
        <button v-for="(item, index) in socialLinks" :key="index"
          @click="navigateTo(item.url, { open: { target: '_blank' } })">
          <Icon :name="item.icon" class="h-8 w-8 transition duration-300" />
          <p v-if="item.comment">{{ item.comment }}</p>
        </button>
      </div>
    </section>

    <footer class="bg-gray-800 text-white text-center py-4">
      <p>&copy; 2024 MsgFog. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">

import logo from "~/assets/logo/logo.svg"
import dark_logo from "~/assets/logo/logo_dark.svg"
import DarkModeBtn from "~/components/DarkModeBtn.vue";

const DarkMode = useThemeStore();
const isDark = ref(DarkMode.isDark)



const navItems = ref([
  { text: 'Features', link: '#features' },
  { text: 'About', link: '#about' },
  { text: 'Contact', link: '#contact' }
]);

const features = ref([
  { icon: "bi:shield-lock", title: 'End-to-End Encryption', description: 'All your messages are encrypted for maximum security.' },
  {
    icon: "bi:person-lock", title: 'User Privacy', description: 'Your data stays yours. No tracking, no selling.'
  },
  { icon: 'bi:cursor', title: 'Seamless Experience', description: 'Enjoy an intuitive and smooth user interface.' }
]);


const socialLinks = ref([
  {
    url: "https://github.com/xva0001", icon: 'bi:github', comment: "Author Github"

  }, {
    url: 'https://github.com/xva0001/fogx',
    icon: 'bi:github', comment: "repo not available now ",

  },
  {
    url: 'https://www.instagram.com/aaron40555/',
    icon: 'bi:instagram', comment: "Author IG",

  },
]);

const GoToLogin = () => {
  GotoLoginPage()
}

</script>

<style scoped>
/* Tailwind CSS handles styles */
</style>