import { IConfig, PeerServer, PeerServerEvents } from "peer"
import type { Server } from "http"
import consola from "consola"
import type { NitroApp } from "nitropack/types"
import getPeerConfig from "../utils/getPeerConfig"
import { verifyJWT, verifyJWTWithBoolean } from "../token_validator/jwt"
import { v4 } from "uuid"
const logger = consola.withTag('PeerServer');

const connectVerify = async (token: string | null, userId: string | null) => {
    if (token && userId) {
        let res = await verifyJWTWithBoolean(token)
        if (res === true) {
            let playload = await verifyJWT(token)
            if (playload.CUUID != userId || playload.login != "completed") {
                logger.warn("No match or Invalid UUID")
                return false
            }
            logger.success("verified User "+ userId )
            return true
        }
    }
    logger.warn("No token or UserID")
    return false
}

const peerStatusListener = (peerServer: PeerServerEvents) => {
    peerServer
        .on('connection', async (client) => {
            logger.log('🔌 New peer connected:', client.getId())
            const blnResult = await connectVerify(client.getToken(), client.getId())
            if (blnResult != true) {
                client.getSocket()?.close()
            }
        })
        .on('disconnect', (client) => {
            logger.log('🚪 Peer disconnected:', client.getId())
        })
        .on('error', (err) => {
            logger.error('❌ PeerServer error:', err)
        });
}
const closeServer = (server: Server) => new Promise<void>((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
});
const usePeerServer = async (nitroApp: NitroApp) => {
    let lowerLevelPeerServer: Server;
    const peerConfig: Readonly<Partial<IConfig>|null> = getPeerConfig() //getConfig
    if (!peerConfig) {
        return //do not run
    }
    const peerServer = PeerServer({...peerConfig,generateClientId:()=>v4()}, (server) => {
        lowerLevelPeerServer = server;
        logger.success("server opened! with :", peerConfig)
    })
    peerStatusListener(peerServer)
    nitroApp.hooks.hook('close', async () => {
        if (lowerLevelPeerServer) {
            await closeServer(lowerLevelPeerServer)
                .then(() => logger.info("PeerServer Close!"))
                .catch((e) => logger.error("Error", e))
        }
    })
}
export default defineNitroPlugin(usePeerServer)