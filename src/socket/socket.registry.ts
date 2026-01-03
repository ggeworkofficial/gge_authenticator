type SocketMeta = {
  socketId: string;
  userId: string;
  appId: string;
  deviceId: string;
};

const sockets = new Map<string, SocketMeta>();

export function registerSocket(meta: SocketMeta) {
  sockets.set(meta.socketId, meta);
}

export function unregisterSocket(socketId: string) {
  sockets.delete(socketId);
}

export function findSockets(filter: Partial<SocketMeta>) {
  return Array.from(sockets.values()).filter((s) => {
    return (
      (!filter.userId || s.userId === filter.userId) &&
      (!filter.appId || s.appId === filter.appId) &&
      (!filter.deviceId || s.deviceId === filter.deviceId)
    );
  });
}
