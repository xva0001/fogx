import Peer from 'peerjs'

export const createCustomPair = (host:string,port:number,path:string,JwtToken:string,userID:string,openFn?:Function,errFn?:Function)=>{    

    const peer= new Peer(userID,{
        host: host,
        port: port,
        path: path,
        token:JwtToken
    })
  
    peer.on('open', (id) => {
        if (openFn) {
            openFn()
        }
    })
    
    peer.on('error', (err) => {
        if (errFn) {
            errFn()
        }
    })

}