import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import appRoutes from "./routes/apps.routes";
import sessionRoutes from "./routes/sessions.routes";
import deviceRoutes from "./routes/devices.routes";
import "reflect-metadata";
import { Logger } from "./utils/logger";

const logger = Logger.getLogger();

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/apps", appRoutes);
app.use("/sessions", sessionRoutes);
app.use("/devices", deviceRoutes);
app.use(errorHandler);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "GGE Authenticator API is running" });
});

const PORT = process.env.PORT
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
