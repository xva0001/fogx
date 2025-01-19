import { mongodb_post_conn_fn, mongodb_user_conn_fn } from "../utils/dbconnect"

export default defineNitroPlugin((nitroApp) => {
    
    mongodb_user_conn_fn()
    mongodb_post_conn_fn()
    
    
})
  