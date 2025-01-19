// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(
  {
    app:{
      head:{
        charset:"utf-8",
        viewport:"width=device-width, initial-scale=1",
        link:[{ rel: 'icon', type: 'image/x-icon', href: '/fav/fav.ico' }]
      },
    },
    modules: [
      "@nuxtjs/tailwindcss",
      "@nuxt/icon",
      "@nuxt/image",
      "@nuxtjs/turnstile",
      "@nuxt/scripts",
      "@nuxt/content"
    ],
    pages : true,

    turnstile:{
      siteKey:  process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      addValidateEndpoint:true
      
    },
    icon:{
      serverBundle:"remote"
    },
    nitro:{
      preset:"vercel"
    },
    runtimeConfig:{
      turnstile:{
        secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY
      }
    }
    ,
    compatibilityDate: "2024-12-25"
  }
)