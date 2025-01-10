import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { CustomError } from "../utils/errors";
import { StatusCodes } from "http-status-codes";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerApplicant(req.body);
      res.status(StatusCodes.CREATED).json({
        status: "success",
        data: result,
        message: "Registration successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new CustomError(
          "Email and password are required",
          StatusCodes.BAD_REQUEST
        );
      }

      const result = await authService.login(email, password);
      res.status(StatusCodes.OK).json({
        status: "success",
        data: result,
        message: "Login successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new CustomError(
          "Authorization token is required",
          StatusCodes.BAD_REQUEST
        );
      }

      const decoded = await authService.verifyToken(token);
      res.status(StatusCodes.OK).json({
        status: "success",
        data: decoded,
        message: "Token is valid",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
