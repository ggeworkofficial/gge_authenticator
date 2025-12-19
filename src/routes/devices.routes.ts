import { Router } from "express";
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceFilterSchema,
  deviceIdParam,
} from "../validators/device.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";
import {
  deviceCreateController,
  deviceListController,
  deviceGetController,
  deviceUpdateController,
  deviceDeleteController,
} from "../controllers/device.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyGenerator: (req) => `create:devices:${req.ip}`
  }),
  authenticateAppController,
  validateBody(createDeviceSchema),
  deviceCreateController
);

/**
 * List devices (admin / app-level)
 */
router.get(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 30,
    keyGenerator: (req) => `get:devices:${req.ip}`
  }),
  authenticateAppController,
  validateQuery(deviceFilterSchema),
  deviceListController
);

/**
 * Get device by ID (user-level)
 */
router.get(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 120,
    keyGenerator: (req) =>
      `user:${req.headers["x-user-id"]}:device:${req.headers["x-device-id"]}`,
  }),
  validateParams(deviceIdParam),
  deviceGetController
);

/**
 * Update device (user-level, sensitive)
 */
router.put(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    keyGenerator: (req) =>
      `user:${req.headers["x-user-id"]}:device:${req.headers["x-device-id"]}`,
  }),
  validateParams(deviceIdParam),
  validateBody(updateDeviceSchema),
  deviceUpdateController
);

/**
 * Delete devices (VERY sensitive)
 */
router.delete(
  "/",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 3,
    keyGenerator: (req) =>
      `user:${req.headers["x-user-id"]}:device:${req.headers["x-device-id"]}`,
  }),
  validateQuery(deviceFilterSchema),
  deviceDeleteController
);

export default router;
