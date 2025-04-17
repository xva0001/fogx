// composables/usePeer.ts
import { Peer, type DataConnection } from 'peerjs';
import { ref } from 'vue';

interface PeerOptions {
  host: string;
  port: number;
  path: string;
  peerId: string; // 改为明确要求 peerId 而非 userID
}

export const usePeer = (options: PeerOptions) => {
  const peer = ref<Peer | null>(null);
  const connections = ref<Record<string, DataConnection>>({});
  const error = ref<Error | null>(null);

  // 初始化 Peer 连接
  const init = (): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      if (peer.value) return resolve(peer.value as Peer);

      const instance = new Peer(options.peerId, {
        host: options.host,
        port: options.port,
        path: options.path,
        config: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      });

      instance.on('open', (id) => {
        peer.value = instance;
        console.log(`Peer 已连接，ID: ${id}`);
        resolve(instance);
      });

      instance.on('error', (err) => {
        error.value = err;
        console.error('Peer 错误:', err);
        reject(err);
      });

      instance.on('connection', (conn) => {
        connections.value[conn.peer] = conn;
        setupConnectionHandlers(conn);
      });
    });
  };

  // 设置连接处理器
  const setupConnectionHandlers = (conn: DataConnection) => {
    conn.on('data', (data) => {
      console.log(`来自 ${conn.peer} 的数据:`, data);
    });

    conn.on('close', () => {
      delete connections.value[conn.peer];
      console.log(`连接关闭: ${conn.peer}`);
    });

    conn.on('error', (err) => {
      console.error(`连接错误 [${conn.peer}]:`, err);
    });
  };

  // 主动连接其他 Peer
  const connect = (peerId: string): Promise<DataConnection> => {
    if (!peer.value) return Promise.reject('Peer 未初始化');

    return new Promise((resolve, reject) => {
      if (!peer.value) {
        return reject(new Error('Peer 未初始化'));
      }
      const conn = peer.value.connect(peerId, {
        serialization: 'json',
        metadata: { timestamp: Date.now() } // 可添加自定义元数据
      });

      conn.on('open', () => {
        connections.value[peerId] = conn;
        setupConnectionHandlers(conn);
        resolve(conn);
      });

      conn.on('error', reject);
    });
  };

  // 发送数据
  const send = (peerId: string, data: unknown) => {
    const conn = connections.value[peerId];
    if (!conn) throw new Error(`未找到连接: ${peerId}`);
    conn.send(data);
  };

  // 销毁所有连接
  const destroy = () => {
    Object.values(connections.value).forEach(conn => conn.close());
    peer.value?.destroy();
    peer.value = null;
    console.log('Peer 实例已销毁');
  };

  return {
    peer,
    connections,
    error,
    init,
    connect,
    send,
    destroy
  };
};