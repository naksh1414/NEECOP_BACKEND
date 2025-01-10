import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";
import { authService } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new CustomError("Invalid authentication", StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];
    const decoded = await authService.verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};
