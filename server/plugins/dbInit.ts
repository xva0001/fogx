//import { mongodb_post_conn_fn, mongodb_user_conn_fn } from "../utils/dbconnect"

import { dbConnsOpen } from "../utils/mongodbConn";
import { consola, createConsola } from "consola";
// import consola from "consola";
// import { supabase } from "../utils/dbconnect";
// import { checkConnection } from "../utils/checkConn";

export default defineNitroPlugin(async (nitroApp) => {
    if (import.meta.dev) {
        console.log("123");
        console.log("dev mode");
    }

    // 使用方式
    const dbNames = useAppConfig().db.conntion.conn_string_env_arr;
    if (dbNames.length % 2 ==  0) {
        consola.info("even number of db connections");
        if (dbNames.length == 0) {
            consola.error("no db connections");
            return ;
        }
    }
    await dbConnsOpen(dbNames);
})
