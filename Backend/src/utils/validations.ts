import { CustomError } from "./errors";

export interface ValidationRule {
  test: RegExp | ((value: string) => boolean);
  message: string;
}

export class Validator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly PASSWORD_RULES: ValidationRule[] = [
    {
      test: /.{8,}/,
      message: "Password must be at least 8 characters long",
    },
    {
      test: /[A-Z]/,
      message: "Password must contain at least one uppercase letter",
    },
    {
      test: /[a-z]/,
      message: "Password must contain at least one lowercase letter",
    },
    {
      test: /[0-9]/,
      message: "Password must contain at least one number",
    },
    {
      test: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Password must contain at least one special character",
    },
  ];

  private static readonly PHONE_REGEX = /^\+?[\d\s-]{10,}$/;
  private static readonly NAME_REGEX = /^[a-zA-Z\s-']{2,}$/;

  static validateEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  static validatePassword(password: string): string[] {
    const errors: string[] = [];

    for (const rule of this.PASSWORD_RULES) {
      if (typeof rule.test === "function") {
        if (!rule.test(password)) {
          errors.push(rule.message);
        }
      } else if (!rule.test.test(password)) {
        errors.push(rule.message);
      }
    }

    return errors;
  }

  static validatePhone(phone: string): boolean {
    return this.PHONE_REGEX.test(phone);
  }

  static validateName(name: string): boolean {
    return this.NAME_REGEX.test(name);
  }

  static validateRegistrationInput(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): void {
    const errors: string[] = [];

    // Validate email
    if (!this.validateEmail(input.email)) {
      errors.push("Invalid email format");
    }

    // Validate password
    const passwordErrors = this.validatePassword(input.password);
    errors.push(...passwordErrors);

    // Validate names
    if (!this.validateName(input.firstName)) {
      errors.push(
        "First name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes"
      );
    }
    if (!this.validateName(input.lastName)) {
      errors.push(
        "Last name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes"
      );
    }

    // Validate phone
    if (!this.validatePhone(input.phone)) {
      errors.push("Invalid phone number format");
    }

    if (errors.length > 0) {
      throw CustomError.BadRequest("Validation failed", errors);
    }
  }
}

// Middleware for request validation
export const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail: any) => detail.message);
        throw CustomError.BadRequest("Validation failed", errors);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
