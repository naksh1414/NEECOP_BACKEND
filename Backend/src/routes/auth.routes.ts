import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateRequest } from "../utils/validations";
import { registrationSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

router.post(
  "/register",
  validateRequest(registrationSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);
router.get("/verify", authenticate, authController.verifyToken);

export default router;
