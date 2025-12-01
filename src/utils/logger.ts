// src/utils/logger.ts
import winston from "winston";
import path from "path";
import fs from "fs";

export class Logger {
  private static instance: winston.Logger;

  static getLogger(): winston.Logger {
    if (this.instance) return this.instance;

    const logsDir = path.join(__dirname, "..", "..", "logs");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(
        ({ level, message, timestamp }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
      )
    );

    this.instance = winston.createLogger({
      level: "info",
      format: logFormat,
      transports: [
        new winston.transports.File({
          filename: path.join(logsDir, "error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: path.join(logsDir, "combined.log"),
        }),
      ],
    });

    // Pretty console logging in development
    if (process.env.NODE_ENV !== "production") {
      this.instance.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }

    return this.instance;
  }
}
