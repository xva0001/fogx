//import { mongodb_post_conn_fn, mongodb_user_conn_fn } from "../utils/dbconnect"

import { dbConnsOpen } from "../utils/mongodbConn";

// import consola from "consola";
// import { supabase } from "../utils/dbconnect";
// import { checkConnection } from "../utils/checkConn";

export default defineNitroPlugin(async (nitroApp) => {
    if (import.meta.dev) {
        console.log("123");
        console.log("dev mode");
    }

    // 使用方式
    const dbNames = ["mdb1", "mdb2", "mdb3"];
    await dbConnsOpen(dbNames);

})
