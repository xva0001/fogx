import { SecFATool } from "~/composables/2FAObj"

export default defineNuxtPlugin(()=>{
    return {
        provide:{
            TOTPvalidator: SecFATool()
        }
    }
})