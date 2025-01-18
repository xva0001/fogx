import { mongodb_conn_fn } from "../utils/dbconnect"

export default defineNitroPlugin((nitroApp) => {
    
    mongodb_conn_fn()
    
})
  