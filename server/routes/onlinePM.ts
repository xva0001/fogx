import type { Peer, Message } from 'crossws'
import { IncomingReqEncryptionHandler, IncomingReqEncryptionPureVersion } from '../eventHandle/EncrytionHandler/IncomingEncryptionHandler'
import { generalTokenSchema } from '../request_sheme/general/generalTokenSchema'
import { verifyJWT } from '../token_validator/jwt'
import { verifyToken } from '../token_validator/paseto'


interface wsStruture {
    times: number
    auth: boolean
    userId: string
    token: string
    intervalObj: NodeJS.Timeout | null
}

const initConnections = new Map<string, wsStruture>()
//let pingInterval : NodeJS.Timeout |null =  null
const PING_INTERVAL = 3000

export default defineWebSocketHandler({

    open(peer) {
        peer.send("Connected to server")

        //initConnections.add(peer.id)

        const ping = () => {
            try {

                peer.send('ping')

                console.log(`Sent ping to ${peer.id}`)
            } catch (err) {
                console.error(`Error pinging ${peer.id}:`, err)
            }
        }
        if (!initConnections.get(peer.id)) {
            initConnections.set(peer.id, {
                times: 0,
                auth: false,
                userId: "",
                token: "",
                intervalObj: setInterval(() => {
                    ping();
                    const conn = initConnections.get(peer.id);
                    if (conn) {
                        conn.times++
                        if (conn.times > 3 && !conn.auth) {
                            clearInterval(conn.intervalObj as NodeJS.Timeout)
                            initConnections.delete(peer.id)
                            peer.close(4001, 'Authentication timeout')
                        }
                    }
                }, PING_INTERVAL)
            });
        }

    },
    async message(peer, message) {
        let req
        try {
            req = await IncomingReqEncryptionPureVersion(JSON.parse(message.toString()), generalTokenSchema)

        } catch (error) {
            console.log("format error");
            initConnections.delete(peer.id)
            return
        }
        let jwtPayload
        let pasetoPayload
        let userID: string
        try {

            jwtPayload = await verifyJWT(req!.jwt)
            pasetoPayload = await verifyToken(req!.paseto)
            userID = jwtPayload.CUUID as string
        } catch (error) {
            console.log("token error");
            initConnections.delete(peer.id)
            return
        }

        const upgradeConn = initConnections.get(peer.id)
        if (upgradeConn) {
            upgradeConn.times = 0
            upgradeConn.auth = true
            upgradeConn.token = req.jwt
            upgradeConn.userId = userID
            initConnections.set(peer.id, upgradeConn)
        }
    },
    close(peer, details) {
        cleanConnection(peer)
    },
    error(peer, error) {
        cleanConnection(peer)
    },
})
function cleanConnection(peer: Peer) {
    const conn = initConnections.get(peer.id)
    if (conn?.intervalObj) {
        clearInterval(conn.intervalObj)
    }
    initConnections.delete(peer.id)
}
