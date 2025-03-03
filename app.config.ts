export default defineAppConfig({

    logLevel: 4, 
    // 0 : trace, 
    // 1 : debug, 
    // 2 : info, 
    // 3 : warn, 
    // 4 : error, 
    // 5 : fatal
    db: {
        type:  "mongodb", // only mongodb is supported currently
        conntion: {
            //connection string environment variable array
            conn_string_env_arr :["mdb1", "mdb2", "mdb3"]
        }
    }

})