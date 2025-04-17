import { IConfig } from "peer"
import { v4 } from "uuid"


let golbalPeerServerConfig : Partial<IConfig> = {};
export default ()=>{
    if (Object.keys(golbalPeerServerConfig).length > 0) {
        return golbalPeerServerConfig
    }else{
        const config = useAppConfig().peerServer
        if (config.enable==false) {
            return null
        }
        const path = config.path || `/peerjs-${v4()}`
        const peerConfig: Readonly<Partial<IConfig>> = Object.freeze({
            host: config.host || "127.0.0.1",
            port: config.port || 9000,  // 默认值
            path:path,
            allow_discovery: true,  // 可选：允许发现其他peer
        })
        golbalPeerServerConfig = Object.freeze({...peerConfig})
        return golbalPeerServerConfig
    }
}