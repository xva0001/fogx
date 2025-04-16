import type {Peer,Message} from 'crossws'

// Track active connections
const activeConnections = new Set<string>()
const waitingQueue: {roomID: string, peerObj: Peer}[] = []

// Ping interval (3 seconds)
const PING_INTERVAL = 3000
let pingInterval: NodeJS.Timeout | null = null

export default defineWebSocketHandler({
    open(peer) {
        console.log(`New connection from peer ${peer.id}`)
        activeConnections.add(peer.id)
        
        // Send welcome message
        peer.send("你好!世界")
        peer.subscribe("ID : <Test> is online")
        peer.publish("id", "123456789")

        // Setup ping/pong using crossws methods
        const ping = () => {
            try {
                peer.send('ping')
                console.log(`Sent ping to ${peer.id}`)
            } catch (err) {
                console.error(`Error pinging ${peer.id}:`, err)
            }
        }

        // Start ping interval if not already running
        if (!pingInterval) {
            pingInterval = setInterval(() => {
                activeConnections.forEach(id => {
                    // Note: In crossws, we can't directly access other peers
                    // so we'll just ping the current peer
                    if (id === peer.id) {
                        ping()
                    }
                })
            }, PING_INTERVAL)
        }
    },
    message(peer, message) {
        console.log("msg");
        

        const  data = JSON.parse(message.toString())

        //verify jwt and paseto here
        if (data.ConnKey==="key") {
            if (waitingQueue.length > 0) {
                
                //get room here
                const openRoom = waitingQueue.shift()

                //userID and Name
                const userInfo = "ID Here"



                //peer.subscribe(userInfo)

                openRoom?.peerObj.subscribe(userInfo) //join room

                openRoom?.peerObj.publish("here","data")

            }else{
                waitingQueue.push({roomID:"key",peerObj:peer})
            }
        }
        console.log(waitingQueue.length);
        
        
    },
    close(peer, details) {
        console.log(`Connection closed for peer ${peer.id}`, details)
        activeConnections.delete(peer.id)
        
        // Clean up from waiting queue
        for (let index = 0; index < waitingQueue.length; index++) {
            const wsConn = waitingQueue[index]
            if (peer.id === wsConn.peerObj.id) {
                waitingQueue.splice(index, 1)
                break
            }
        }
        
        // Clear interval if no more connections
        if (activeConnections.size === 0 && pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
            console.log('Stopped ping interval')
        }
    },
    error(peer, error) {
        console.error(`Error with peer ${peer.id}:`, error)
        activeConnections.delete(peer.id)
        
        // Clean up from waiting queue
        for (let index = 0; index < waitingQueue.length; index++) {
            const wsConn = waitingQueue[index]
            if (peer.id === wsConn.peerObj.id) {
                waitingQueue.splice(index, 1)
                break
            }
        }
        
        // Clear interval if no more connections
        if (activeConnections.size === 0 && pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
            console.log('Stopped ping interval')
        }
    },
})
