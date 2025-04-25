import { Peer, type DataConnection } from 'peerjs'
import { ref } from 'vue'
import { usePeerServer } from './usePeerServer'
import type { Conversations } from './PrivateChatObjectInterface'

export interface PeerConnectionOptions {
  jwt: string
  paseto: string
  CUUID: string
}

export const usePeerConnection = async() => {
  const peer = ref<Peer | null>(null)
  const connections = ref<Record<string, DataConnection>>({})
  const currentPeerId = ref('')
  const error = ref<Error | null>(null)
  const conversations  = ref<Conversations[]>([])
  
  const { getPeerConnectionDetails } = await usePeerServer()

  /**
   * 
   * @param options - peer option
   * @returns Peer
   */
  const init = async (options: PeerConnectionOptions) => {
    try {
      const { userUUID, orgUrlPath } = await getPeerConnectionDetails(
        options.jwt,
        options.paseto
      )

      return new Promise<Peer>((resolve, reject) => {
        console.log(orgUrlPath);
        
        const instance = new Peer(userUUID, {
          host: orgUrlPath.host,
          port: orgUrlPath.port,
          path: orgUrlPath.path,
          token:options.jwt
        })

        instance.on('open', (id) => {
          currentPeerId.value = id
          console.log(id);
          peer.value = instance
          resolve(instance)
        })

        instance.on('error', (err) => {
          error.value = err
          console.log(err);
          reject(err)

        })

        instance.on('connection', (conn) => {

          if (connections.value[conn.peer]) {
            connections.value[conn.peer].close()
          }

          connections.value[conn.peer] = conn
          setupConnectionHandlers(conn)
        })
        
      })
    } catch (err) {
      error.value = err as Error
      throw err
    }
  }

  /**
   * 
   * @param conn set a listener
   */
  const setupConnectionHandlers = (conn: DataConnection) => {
    conn.on('data', (data) => {
      if (typeof data === 'string') {       
        const receiveMsg = JSON.parse(data)
        console.log(receiveMsg);
        if (receiveMsg.type == "message") {
          const convArr = conversations.value
          for (let index = 0; index < convArr.length; index++) {
            const citem = convArr[index];
            if (citem.friendId==conn.connectionId) {
              citem.listOfMessage.push(receiveMsg)
              break
            }
          }

        }
      }
      return data
    })
    
    conn.on('close', () => {
      delete connections.value[conn.peer]
    })
  }

  const connect = (peerId: string): Promise<DataConnection> => {
    if (!peer.value) return Promise.reject('Peer not initialized')
    
    return new Promise((resolve, reject) => {
      const conn = peer.value!.connect(peerId)

      const onErr = (err:any)=>{
        console.log(err);
        peer.value?.off("error",onErr)  
        reject(err)

      }
      peer.value?.on("error",onErr)

      conn.on('open', () => {
        peer.value?.off("error",onErr)  
        connections.value[peerId] = conn
        setupConnectionHandlers(conn)
        resolve(conn)
      })
      conn.on('error', (err)=>{
        console.log(err);
        peer.value?.off("error",onErr)  
        reject()
      })
    })
  }

  const send = (peerId: string, data: any) => {
    const conn = connections.value[peerId]
    if (!conn) throw new Error('No connection to peer')
    conn.send(JSON.stringify(data))
  }

  const destroy = () => {
    Object.values(connections.value).forEach(conn => conn.close())
    peer.value?.destroy()
    peer.value = null
  }

  return {
    peer,
    currentPeerId,
    connections,
    error,
    conversations,
    init,
    connect,
    send,
    destroy
  }
}
