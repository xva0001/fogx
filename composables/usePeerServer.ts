import RequestEncryption from '~/shared/Request/requestEncrytion'
import { calSharedKey, genKeyCurve25519 } from '~/shared/useKeyFn'

interface PeerLinkResponse {
  encryptedMessage: string
  sharedKey: string
  iv: string
}

interface PeerServerOptions {
  host: string
  port: number
  path: string
}

export const usePeerServer = async() => {
  const getPeerConnectionDetails = async (jwt: string, paseto: string) => {
    let shared
    try {
  
      const servPubKeyData = await $fetch<{ pubkey: string }>("/api/ECDHpubkey");
      const pair = genKeyCurve25519();

      shared = calSharedKey(servPubKeyData.pubkey, pair.getPrivate("hex"));
      
      const response = await $fetch<PeerLinkResponse>('/api/getPeerLink', {
        method: 'POST',
        body: {...await RequestEncryption.encryptMessage(JSON.stringify({jwt:jwt,paseto:paseto}),shared),pubkey:pair.getPublic("hex")}
      })

      const decrypted = await RequestEncryption.decryptMessage(
        response.encryptedMessage,
        shared,
        response.iv
      )
      
      return JSON.parse(decrypted) as {
        userUUID: string
        orgUrlPath: PeerServerOptions
      }
    } catch (error) {
      console.error('Failed to get peer connection details:', error)
      throw error
    }
  }

  return {
    getPeerConnectionDetails
  }
}
