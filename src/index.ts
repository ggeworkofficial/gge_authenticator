import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/register.routes";
import "reflect-metadata";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "GGE Authenticator API is running" });
});

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
