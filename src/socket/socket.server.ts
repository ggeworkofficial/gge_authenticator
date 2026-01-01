import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { registerSocket, unregisterSocket } from "./socket.registry";
import { Logger } from "../utils/logger";


const logger = Logger.getLogger();

let io: SocketIOServer;

export function initSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("register", (payload) => {
      /**
       * payload = { userId, appId, deviceId }
       * Sent from frontend AFTER auth
       */
      registerSocket({
        socketId: socket.id,
        userId: payload.userId,
        appId: payload.appId,
        deviceId: payload.deviceId,
      });
      logger.info(`Socket registered: ${socket.id} for user ${payload.userId}`);
    });

    socket.on("disconnect", () => {
      unregisterSocket(socket.id);
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
