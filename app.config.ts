export default defineAppConfig({

    peerServer:{
        host : "192.168.1.249", //ip
        enable: true,
        port : 9000, //port : number
        path : null
    },

    logLevel: 4, 
    // 0 : trace, 
    // 1 : debug, 
    // 2 : info, 
    // 3 : warn, 
    // 4 : error, 
    // 5 : fatal
    domain :"http://192.168.1.249",
    db: {
        type:  "mongodb", // only mongodb is supported currently
        conntion: {
            //connection string environment variable array
            conn_string_env_arr :["mdb1", "mdb2", "mdb3"]
        },
        stopConnectionTestingWhenStart: true
    },

    dataDistributionMode: {

        /**
         * default value : strict
         * strict : no fault tolerance, data will be lost if any node goes down
         * half-mode : data will be lost if more than half of the nodes goes down
         * debug-mode : data will be stored in all nodes, but read will be done from only one node
         * debug-mode-half : refer half-mode
         */
        mode:"debug-mode-half",

        /**
         * customize: configure your own data distribution mode
         * shares: number of data shares
         * restore: number of data minimal restore
         *  if your settings has error, it will follow the default settings (mode)
         */
        customize:{
            // data shares (number) : default is null //資料分片 
            //less that 3 will be considered as a connection number
            shares : null,
            // data minimal restore (number) : default is null //資料最小還原
            // less than 2 will be considered as a half of connection number(if even number, it will be half+1)
            restore : null
        }

    },
    verification:{
        /**
         * no other options currently
         * in the future, server owner can choose the verification method
         */
        jwt: true,
        paseto:true,
        tokenvaildTime : 120_000, //two mins,
        tokenVaildTime_loged : 12000_000 

    }

})