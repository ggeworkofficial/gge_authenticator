import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  authenticateSchema,
  changePasswordSchema,
  verifiyEmailSchema,
} from "../validators/auth.validator";
import { loginController, registerController, authenticateController, refreshController } from "../controllers/auth.controller";
import { changePasswordController } from "../controllers/auth.controller";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/register", validateBody(registerSchema), registerController);
router.post("/change-password", validateBody(changePasswordSchema), changePasswordController);
router.post("/authenticate", validateBody(authenticateSchema), authenticateController);
router.post("/refresh", validateBody(refreshSchema), refreshController);
//router.post("/verify-email", validateBody(verifiyEmailSchema), verifiyEmailController);
export default router;
