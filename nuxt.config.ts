// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(
  {
    app:{
      head:{
        charset:"utf-8",
        viewport:"width=device-width, initial-scale=1"
      },
    },
    modules: ["@nuxtjs/tailwindcss", "@nuxt/icon", "@nuxt/image"],
    pages : true,

    nitro:{
      preset : "cloudflare-pages"
    },
    compatibilityDate: "2024-12-25"
  }
)