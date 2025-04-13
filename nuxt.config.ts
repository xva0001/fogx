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
      "@nuxt/content",
      // "@nuxtjs/supabase"
    ],

    alias:{
      "~~":"/pages/dashboard/composables",
    },


    pages : true,
    devServer:{
      host:"127.0.0.1"
    },
    content:{
      build: {
        markdown: {
          highlight: {
            theme: {
              // Default theme (same as single string)
              default: 'github-light',
              // Theme used if `html.dark`
              dark: 'github-dark',
              // Theme used if `html.sepia`
              sepia: 'monokai'
            }
          }
        }
      } 
    }
    ,

    turnstile:{
      siteKey:  import.meta.dev?"1x00000000000000000000AA":process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      addValidateEndpoint:true
      
    },
    icon:{
      serverBundle:"remote"
    },
    vite:{
      optimizeDeps:{
        esbuildOptions:{
          loader:{
            ".ts":"ts"
          }
        }
      }
    },
    nitro:{
      rollupConfig:{
        
      } ,
      experimental:{
        wasm: true
      }
    },
    

    build:{
      "transpile" : ["easy-shamir-secret-sharing"]
    },
    runtimeConfig:{


      
      turnstile:{
        secretKey:import.meta.dev?"1x0000000000000000000000000000000AA": process.env.NUXT_TURNSTILE_SECRET_KEY
      },
      supabase:{
        
      }
    }
    ,
    compatibilityDate: "2024-12-25",
    
  }
)