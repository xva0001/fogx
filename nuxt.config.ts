// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(
  {
    modules: ["@nuxtjs/tailwindcss"],
    pages : true,
    nitro:{
      preset : "cloudflare-pages"
    }
  }
)