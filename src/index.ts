import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import "reflect-metadata";
import { Logger } from "./utils/logger";
import { MongoDB } from "./connections/mongodb";
import { RedisClient } from "./connections/redis";
import { createServer } from "http";
import { initSocket } from "./socket/socket.server";
import { initUnreadCounterIndexes } from "./models/mongodb/UnreadCounterDocument";
const mongodb = MongoDB.getInstance();

const logger = Logger.getLogger();

dotenv.config();
async function start() {
  await mongodb.connect();
  await initUnreadCounterIndexes();
  RedisClient.getInstance();

  const app = express();
  app.use(express.json());
  app.use(cors());

  const authRoutes = (await import("./routes/auth.routes")).default;
  const userRoutes = (await import("./routes/user.routes")).default;
  const appRoutes = (await import("./routes/apps.routes")).default;
  const sessionRoutes = (await import("./routes/sessions.routes")).default;
  const deviceRoutes = (await import("./routes/devices.routes")).default;
  const notificationRoutes = (await import("./routes/notification.routes")).default;

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/apps", appRoutes);
  app.use("/sessions", sessionRoutes);
  app.use("/devices", deviceRoutes);
  app.use("/notifications", notificationRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT;
  const httpServer = createServer(app);

  initSocket(httpServer);

  try {
    const { NotificationService } = await import("./services/notification/notification.service");
    const { SelfObserver } = await import("./services/notification/observers/self.observer");
    const notifSvc = new NotificationService();
    notifSvc.addObserver(new SelfObserver());
    notifSvc.startWatching();
  } catch (err) {
    logger.warn("Failed to start notification watcher", err);
  }

  httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

start();

