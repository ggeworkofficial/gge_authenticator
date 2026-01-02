import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import {
  createNotificationSchema,
  listNotificationQuery,
  notificationIdParam,
  updateNotificationSchema,
  updateReadSchema,
} from "../validators/notification.validators";
import {
  createNotificationController,
  listNotificationsController,
  getNotificationController,
  readNotificationController,
  updateNotificationController,
  deleteNotificationController,
} from "../controllers/notification.controller";
import { rateLimiter } from "../middlewares/rateLimiter";
import { authorizeIdentity } from "../middlewares/identityAuthorizer";
import { authenticateMiddleware } from "../middlewares/authenticator";
import { authenticateAppMiddleware } from "../middlewares/appAuthenticator";

const router = Router();

// POST - send notification (apps use app authentication)
router.post(
  "/",
  rateLimiter({ windowSeconds: 60, maxRequests: 60, keyGenerator: (req) => `notification:app:${req.ip}` }),
  authenticateAppMiddleware,
  validateBody(createNotificationSchema),
  createNotificationController
);

// GET - list notifications for authenticated user
router.get(
  "/",
  authenticateMiddleware,
  authorizeIdentity({ allowAdmin: true, allowPartial: true }),
  rateLimiter({ windowSeconds: 60, maxRequests: 120, keyGenerator: (req) => `notification:${req.auth!.user_id}:device:${req.auth!.device_id}` }),
  validateQuery(listNotificationQuery),
  listNotificationsController
);

router.get(
  "/:id",
  authenticateMiddleware,
  authorizeIdentity({ allowAdmin: true, allowPartial: true }),
  rateLimiter({ windowSeconds: 60, maxRequests: 60, keyGenerator: (req) => `notification:get:${req.auth!.user_id}` }),
  validateParams(notificationIdParam),
  getNotificationController
);

router.patch(
  "/read/:id",
  authenticateMiddleware,
  authorizeIdentity({ allowAdmin: true, allowPartial: true }),
  rateLimiter({ windowSeconds: 60, maxRequests: 300, keyGenerator: (req) => `notification:read:${req.auth!.user_id}:device:${req.auth!.device_id}` }),
  validateParams(notificationIdParam),
  validateBody(updateReadSchema),
  readNotificationController
);

router.put(
  "/:id",
  authenticateMiddleware,
  authorizeIdentity({ allowAdmin: true, allowPartial: true }),
  rateLimiter({ windowSeconds: 60, maxRequests: 50, keyGenerator: (req) => `notification:update:${req.auth!.user_id}` }),
  validateParams(notificationIdParam),
  validateBody(updateNotificationSchema),
  updateNotificationController
);

router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeIdentity({ allowAdmin: true, allowPartial: true }),
  rateLimiter({ windowSeconds: 300, maxRequests: 10, keyGenerator: (req) => `notification:delete:${req.auth!.user_id}` }),
  validateParams(notificationIdParam),
  deleteNotificationController
);

export default router;
