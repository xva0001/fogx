export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:error',(err)=>{
        if (err.message.startsWith("Failed to fetch dynamically imported module:")) {
            reloadNuxtApp()    
        }
        
    })
})