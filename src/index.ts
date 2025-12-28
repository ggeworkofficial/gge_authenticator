import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middlewares/errorHandler";
import "reflect-metadata";
import { Logger } from "./utils/logger";
import { MongoDB } from "./connections/mongodb";
import { RedisClient } from "./connections/redis";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const mongodb = MongoDB.getInstance();

const logger = Logger.getLogger();

dotenv.config();
async function start() {
  await mongodb.connect();
  RedisClient.getInstance();

  const app = express();
  app.use(express.json());
  app.use(cors());

  const authRoutes = (await import("./routes/auth.routes")).default;
  const userRoutes = (await import("./routes/user.routes")).default;
  const appRoutes = (await import("./routes/apps.routes")).default;
  const sessionRoutes = (await import("./routes/sessions.routes")).default;
  const deviceRoutes = (await import("./routes/devices.routes")).default;

  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/apps", appRoutes);
  app.use("/sessions", sessionRoutes);
  app.use("/devices", deviceRoutes);
  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT;
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // allow your frontend origin here
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}

start();

