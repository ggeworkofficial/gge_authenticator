import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  authenticateSchema,
  changePasswordSchema,
  verifiyEmailSchema,
  verifyCodeSchema,
} from "../validators/auth.validator";
import { loginController, registerController, authenticateController, refreshController, verifiyController, authenticateAppController } from "../controllers/auth.controller";
import { changePasswordController } from "../controllers/auth.controller";

const router = Router();

router.post("/login", authenticateAppController, validateBody(loginSchema), loginController);
router.post("/register", authenticateAppController, validateBody(registerSchema), registerController);

router.post("/authenticate", validateBody(authenticateSchema), authenticateController);
router.post("/refresh", validateBody(refreshSchema), refreshController);
router.post("/verify", validateBody(verifyCodeSchema), verifiyController);

router.patch("/change-password", validateBody(changePasswordSchema), changePasswordController);
//router.post("/verify-email", validateBody(verifiyEmailSchema), verifiyEmailController);
export default router;
