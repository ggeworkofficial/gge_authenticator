import { Request, Response, NextFunction } from "express";
import { MainError } from "../errors/main.error"; 
import { Logger } from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const isMainError = err instanceof MainError;

  const statusCode = isMainError ? err.statusCode : 500;
  const errorType = isMainError ? err.name : "InternalServerError";
  const message = isMainError ? err.message : "Something went wrong";

  const logger = Logger.getLogger();
  logger.error(
    `${errorType}: ${message} ${isMainError && err.details ? `| Details: ${JSON.stringify(err.details)}` : ""
    }`
  );

  res.status(statusCode).json({
    status: "error",
    errorType,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
};