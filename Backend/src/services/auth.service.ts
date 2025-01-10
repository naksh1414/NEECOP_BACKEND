// src/services/auth.service.ts
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import BaseUser from "../models/user.model";
import { CustomError } from "../utils/errors";
import { Validator } from "../utils/validations";
import { logger } from "../utils/logger";
import { Document } from "mongoose";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Define the user object structure without sensitive data
interface SafeUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

// Define the full user document type
interface UserDocument extends Document, RegisterInput {
  _id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET =
      process.env.JWT_SECRET ||
      "thisisnotasecretbutasafeoneistheoneintheenvfile";
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
  }

  private generateToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
    };
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      algorithm: "HS256",
    });
  }

  private async validateRegistrationInput(
    userData: RegisterInput
  ): Promise<void> {
    if (!Validator.validateEmail(userData.email)) {
      throw new CustomError("Invalid email format", StatusCodes.BAD_REQUEST);
    }

    if (!Validator.validatePassword(userData.password)) {
      throw new CustomError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        StatusCodes.BAD_REQUEST
      );
    }

    if (!userData.firstName?.trim() || !userData.lastName?.trim()) {
      throw new CustomError(
        "First name and last name are required",
        StatusCodes.BAD_REQUEST
      );
    }

    if (!userData.phone?.trim()) {
      throw new CustomError(
        "Phone number is required",
        StatusCodes.BAD_REQUEST
      );
    }
  }

  private sanitizeUser(user: UserDocument): SafeUser {
    const userObj = user.toObject();
    const { password, ...safeUser } = userObj;
    return safeUser as SafeUser;
  }

  async registerApplicant(userData: RegisterInput) {
    try {
      // Validate input
      await this.validateRegistrationInput(userData);

      // Check if user already exists
      const existingUser = await BaseUser.findOne({
        email: userData.email.toLowerCase(),
      });
      if (existingUser) {
        throw new CustomError("Email already registered", StatusCodes.CONFLICT);
      }

      // Create new applicant
      const user = new BaseUser({
        ...userData,
        email: userData.email.toLowerCase(),
      }) as UserDocument;

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user._id.toString(), user.email);

      // Remove sensitive data and return user object
      const safeUser = this.sanitizeUser(user);

      logger.info(`User registered successfully: ${user._id}`);

      return {
        user: safeUser,
        token,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Registration failed: ${error.message}`);
      } else {
        logger.error(`Registration failed: ${error}`);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      // Log the full error for debugging
      logger.error(error);
      throw new CustomError(
        "Registration failed: An unexpected error occurred",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new CustomError(
          "Email and password are required",
          StatusCodes.BAD_REQUEST
        );
      }

      // Find user by email
      const user = (await BaseUser.findOne({
        email: email.toLowerCase(),
      })) as UserDocument | null;

      if (!user) {
        throw new CustomError("Invalid credentials", StatusCodes.UNAUTHORIZED);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new CustomError("Account is deactivated", StatusCodes.FORBIDDEN);
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new CustomError("Invalid credentials", StatusCodes.UNAUTHORIZED);
      }

      // Generate token
      const token = this.generateToken(user._id, user.email);

      // Remove sensitive data
      const safeUser = this.sanitizeUser(user);

      logger.info(`User logged in successfully: ${user._id}`);

      return {
        user: safeUser,
        token,
      };
    } catch (error) {
      logger.error(`Login failed`);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Login failed`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new CustomError(
        "Invalid or expired token",
        StatusCodes.UNAUTHORIZED
      );
    }
  }
}

export const authService = new AuthService();
