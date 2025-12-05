import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error"; 

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the error is an instance of AppError, use its properties
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;
  const errorType = isAppError ? err.name : "InternalServerError";
  const message = isAppError ? err.message : "Something went wrong";

  res.status(statusCode).json({
    status: "error",
    errorType,
    message,
    ...(err.details ? { details: err.details } : {}),
  });

  // Optionally log the error stack for debugging
  console.error(err.stack);
};