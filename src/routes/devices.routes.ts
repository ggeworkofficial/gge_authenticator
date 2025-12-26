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
import { rateLimiter } from "../middlewares/rateLimiter";
import { authorizeIdentity } from "../middlewares/identityAuthorizer";
import { extractDeviceIdentity } from "../middlewares/deviceIdentityExtractor";
import { authenticateMiddleware } from "../middlewares/authenticator";
import { authenticateAppMiddleware } from "../middlewares/appAuthenticator";

const router = Router();

router.post(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyGenerator: (req) => `create:devices:${req.ip}`
  }),
  authenticateAppMiddleware,
  validateBody(createDeviceSchema),
  deviceCreateController
);

router.get(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 30,
    keyGenerator: (req) => `get:devices:${req.ip}`
  }),
  authenticateAppMiddleware,
  validateQuery(deviceFilterSchema),
  deviceListController
);

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
  extractDeviceIdentity,
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
    checkDevice: true,
  }),
  deviceGetController
);

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
  extractDeviceIdentity,
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
    checkDevice: true,
  }),
  deviceUpdateController
);

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
  authorizeIdentity({
    allowAdmin: true,
    checkUser: true,
    checkDevice: true,
    allowPartial: true
  }),
  deviceDeleteController
);

export default router;
