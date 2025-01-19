//import { mongodb_post_conn_fn, mongodb_user_conn_fn } from "../utils/dbconnect"

import consola from "consola";
import { supabase } from "../utils/dbconnect";
import { checkConnection } from "../utils/checkConn";

export default defineNitroPlugin(async (nitroApp) => {
    
    // mongodb_user_conn_fn()
    // mongodb_post_conn_fn()
    console.info("testing")
    let test = await checkConnection()
    console.log(test);
    
    //console.log(supabase.storage);
    
    
})
  