import { Peer, type DataConnection } from 'peerjs'
import { ref } from 'vue'
import { usePeerServer } from './usePeerServer'

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
  
  const { getPeerConnectionDetails } = await usePeerServer()

  const init = async (options: PeerConnectionOptions) => {
    try {
      const { userUUID, orgUrlPath } = await getPeerConnectionDetails(
        options.jwt,
        options.paseto
      )

      return new Promise<Peer>((resolve, reject) => {
        const instance = new Peer(userUUID, {
          host: orgUrlPath.host,
          port: orgUrlPath.port,
          path: orgUrlPath.path,
          token:options.jwt
        })

        instance.on('open', (id) => {
          currentPeerId.value = id
          peer.value = instance
          resolve(instance)
        })

        instance.on('error', (err) => {
          error.value = err
          reject(err)
        })

        instance.on('connection', (conn) => {
          connections.value[conn.peer] = conn
          setupConnectionHandlers(conn)
        })
      })
    } catch (err) {
      error.value = err as Error
      throw err
    }
  }

  const setupConnectionHandlers = (conn: DataConnection) => {
    conn.on('data', (data) => {
      if (typeof data === 'string') {
        return JSON.parse(data)
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
      conn.on('open', () => {
        connections.value[peerId] = conn
        setupConnectionHandlers(conn)
        resolve(conn)
      })
      conn.on('error', reject)
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
    init,
    connect,
    send,
    destroy
  }
}
