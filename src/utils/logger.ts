// src/utils/logger.ts
import winston from "winston";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";

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
        ({ level, message, timestamp }) =>
          `[${timestamp}] ${level.toUpperCase()}: ${message}`
      )
    );

    this.instance = winston.createLogger({
      level: "info",
      format: logFormat,
      transports: [
        // ----- ERROR LOGS -----
        new DailyRotateFile({
          dirname: logsDir,
          filename: "error-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: "10m",      // rotate if file exceeds 10 MB
          maxFiles: "14d",     // keep logs for 14 days
          zippedArchive: true, // compress old logs
        }),

        // ----- COMBINED LOGS -----
        new DailyRotateFile({
          dirname: logsDir,
          filename: "combined-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",      // rotate after 20 MB
          maxFiles: "14d",     // keep for 14 days
          zippedArchive: true,
        }),
      ],
    });

    // Pretty console logging in dev
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
