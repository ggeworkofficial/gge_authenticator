import { NotificationDocument } from "../../../models/mongodb/NotificationDocument";
import { findSockets } from "../../../socket/socket.registry";
import { getIO } from "../../../socket/socket.server";
import { Observer } from "./observer.interface";

export class SelfObserver implements Observer {
    async update(data: NotificationDocument): Promise<void> {
       const io = getIO();
         const sockets = findSockets({
            userId: data.userId,
            appId: data.metadata?.appId,
            deviceId: data.metadata?.deviceId,
        });

        for (const socketMeta of sockets) {
            io.to(socketMeta.socketId).emit("notification", data);
        }
    }
} 