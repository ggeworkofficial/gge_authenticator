import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validator";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  authenticateSchema,
  changePasswordSchema,
  verifyCodeSchema,
  authIdParamSchema,
} from "../validators/auth.validator";
import { loginController, registerController, refreshController, verifiyController, authenticateAppController, authenticateController, isAdminController } from "../controllers/auth.controller";
import { changePasswordController } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";
import { authorizeIdentity } from "../middlewares/identityAuthorizer";
import { authenticateMiddleware } from "../middlewares/authenticator";

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
  authenticateController
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
  authorizeIdentity({
    checkUser: true
  }),
  changePasswordController
);

router.get(
  "/is-admin/:id",
  authenticateMiddleware,
  rateLimiter({ windowSeconds: 60, maxRequests: 20, keyGenerator: (req) => `is-admin:user${req.auth?.app_id}device${req.auth?.device_id}app${req.auth?.app_id}` }),
  validateParams(authIdParamSchema),
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true
  }),
  isAdminController
);
//router.post("/verify-email", validateBody(verifiyEmailSchema), verifiyEmailController);
export default router;
