import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  verifiyEmailSchema,
} from "../validators/auth.validator";
import { loginController } from "../controllers/auth.controller";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);

export default router;
