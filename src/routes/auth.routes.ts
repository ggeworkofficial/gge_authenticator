import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  verifiyEmailSchema,
} from "../validators/auth.validator";
import { loginController, registerController } from "../controllers/auth.controller";
import { changePasswordController } from "../controllers/auth.controller";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/register", validateBody(registerSchema), registerController);
router.post("/change-password", validateBody(changePasswordSchema), changePasswordController);

export default router;
