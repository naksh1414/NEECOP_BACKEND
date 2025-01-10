import { StatusCodes } from "http-status-codes";
import { logger } from "./logger";

export class CustomError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static BadRequest(message: string, errors?: any[]) {
    return new CustomError(message, StatusCodes.BAD_REQUEST, errors);
  }

  static Unauthorized(message: string = "Unauthorized") {
    return new CustomError(message, StatusCodes.UNAUTHORIZED);
  }

  static Forbidden(message: string = "Forbidden") {
    return new CustomError(message, StatusCodes.FORBIDDEN);
  }

  static NotFound(message: string = "Resource not found") {
    return new CustomError(message, StatusCodes.NOT_FOUND);
  }

  static Conflict(message: string) {
    return new CustomError(message, StatusCodes.CONFLICT);
  }

  static Internal(message: string = "Internal server error") {
    return new CustomError(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

// Global error handling middleware
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  logger.error(err.stack);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      errors: err.errors,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error: any) => error.message);
    return res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: "Validation Error",
      errors,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(StatusCodes.CONFLICT).json({
      status: "error",
      message: `${field} already exists`,
    });
  }

  // Default error
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: "Internal Server Error",
  });
};
