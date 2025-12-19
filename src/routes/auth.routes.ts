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
  rateLimiter({windowSeconds: 60, maxRequests: 5, keyGenerator: (req) => `login:${req.ip}`}),
  authenticateAppController, 
  validateBody(loginSchema), 
  loginController
);

router.post(
  "/register",
  rateLimiter({ windowSeconds: 60, maxRequests: 3, keyGenerator: (req) => `register:${req.ip}` }),
  authenticateAppController,
  validateBody(registerSchema),
  registerController
);

router.post(
  "/authenticate",
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyGenerator: (req) => `authenticate:${req.ip}` }),
  authenticateAppController,
  validateBody(authenticateSchema),
  authenticateEndpoint
);

router.post(
  "/refresh",
  rateLimiter({ windowSeconds: 60, maxRequests: 20, keyGenerator: (req) => `refresh:${req.ip}` }),
  authenticateAppController,
  validateBody(refreshSchema),
  refreshController
);

router.post(
  "/verify",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyGenerator: (req) => `verify:${req.ip}` }),
  validateBody(verifyCodeSchema),
  verifiyController
);

router.patch(
  "/change-password",
  rateLimiter({ windowSeconds: 60, maxRequests: 2, keyGenerator: (req) => `change-password:${req.ip}` }),
  authenticateMiddleware,
  validateBody(changePasswordSchema),
  changePasswordController
);
//router.post("/verify-email", validateBody(verifiyEmailSchema), verifiyEmailController);
export default router;
