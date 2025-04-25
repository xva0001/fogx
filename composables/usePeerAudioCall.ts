import { Peer, type DataConnection, type MediaConnection } from 'peerjs'

export const usePeerAudioCall = (peer: Ref<Peer | null>,) => {
    const localStream = ref<MediaStream | null>(null)
    const remoteStream = ref<MediaStream | null>(null)
    const callRef = ref<MediaConnection | null>(null)
  
    const startAudio = async () => {
      localStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
  
    const call = (id: string) => {
      if (!peer.value || !localStream.value) return
      const call = peer.value.call(id, localStream.value)
      callRef.value = call
      call.on('stream', stream => {
        remoteStream.value = stream
      })
    }
  
    const answer = () => {
      if (!peer.value) return
      peer.value.on('call', call => {
        call.answer(localStream.value!)
        callRef.value = call
        call.on('stream', stream => {
          remoteStream.value = stream
        })
      })
    }
  
    const stop = () => {
      localStream.value?.getTracks().forEach(t => t.stop())
      remoteStream.value = null
      callRef.value?.close()
    }
  
    return {
      localStream,
      remoteStream,
      startAudio,
      call,
      answer,
      stop
    }
  }
  