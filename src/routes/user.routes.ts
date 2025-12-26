import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";
import { userCreateController, userListController, userGetController, userUpdateController, userDeleteController } from "../controllers/user.controller";
import { isAdminMiddleware } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";
import { authorizeIdentity } from "../middlewares/identityAuthorizer";
import { authenticateMiddleware } from "../middlewares/authenticator";
import { authenticateAppMiddleware } from "../middlewares/appAuthenticator";

const router = Router();

router.post(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 5,
    keyGenerator: (req) => `user:${req.ip}`,
  }),
  authenticateAppMiddleware,
  validateBody(createUserSchema),
  userCreateController
);

router.get(
  "/",
  authenticateMiddleware,
  isAdminMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  userListController
);

router.get(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 60,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateParams(userIdParam),
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
  }),
  userGetController
);

router.put(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 15,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateParams(userIdParam),
  validateBody(updateUserSchema),
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
  }),
  userUpdateController
);

router.delete(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 2,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateParams(userIdParam),
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
  }),
  userDeleteController
);
export default router;