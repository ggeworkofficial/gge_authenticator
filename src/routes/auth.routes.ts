import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  authenticateSchema,
  changePasswordSchema,
  verifyCodeSchema,
} from "../validators/auth.validator";
import { loginController, registerController, refreshController, verifiyController, authenticateAppController, authenticateEndpoint, authenticateMiddleware } from "../controllers/auth.controller";
import { changePasswordController } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post(
  "/login", 
  rateLimiter({windowSeconds: 60, maxRequests: 5}),
  authenticateAppController, 
  validateBody(loginSchema), 
  loginController
);

router.post(
  "/register",
  rateLimiter({ windowSeconds: 60, maxRequests: 3 }),
  authenticateAppController,
  validateBody(registerSchema),
  registerController
);

router.post(
  "/authenticate",
  rateLimiter({ windowSeconds: 60, maxRequests: 10 }),
  authenticateAppController,
  validateBody(authenticateSchema),
  authenticateEndpoint
);

router.post(
  "/refresh",
  rateLimiter({ windowSeconds: 60, maxRequests: 20 }),
  authenticateAppController,
  validateBody(refreshSchema),
  refreshController
);

router.post(
  "/verify",
  rateLimiter({ windowSeconds: 60, maxRequests: 3 }),
  validateBody(verifyCodeSchema),
  verifiyController
);

router.patch(
  "/change-password",
  rateLimiter({ windowSeconds: 60, maxRequests: 2 }),
  authenticateMiddleware,
  validateBody(changePasswordSchema),
  changePasswordController
);
//router.post("/verify-email", validateBody(verifiyEmailSchema), verifiyEmailController);
export default router;
