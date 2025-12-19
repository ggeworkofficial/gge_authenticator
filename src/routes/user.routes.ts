import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";
import { userCreateController, userListController, userGetController, userUpdateController, userDeleteController } from "../controllers/user.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 5,
    keyGenerator: (req) => `user:${req.ip}`,
  }),
  authenticateAppController,
  validateBody(createUserSchema),
  userCreateController
);

router.get(
  "/",
  authenticateMiddleware,
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
  userDeleteController
);
export default router;