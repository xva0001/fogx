interface Friend {
    id: string
    name: string
    icon?: string
    online?: boolean
    lastMessage: string
    time: string
    peerId?: string
  }
  
  interface Message {
    type : "message"|"volce_call"|"video_call"|"test"
    sender: string
    content: string
    time: string
    images?: string[] // Base64 encoded images
    isCall?: boolean
    callAccepted?: boolean
  }
  
  interface Conversations {
    friendId : string,
    listOfMessage : Message[]
  }

  export  { type Friend,type Message,type Conversations }