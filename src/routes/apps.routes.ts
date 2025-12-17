import { Router } from "express";
import {
  createAppSchema,
  updateAppSchema,
  appsFilterQuerySchema,
  appIdParam,
  changeAppsSecretSchema
} from "../validators/apps.validator";
import { createUserAppSchema } from "../validators/apps.validator";
import { 
  validateBody, 
  validateQuery, 
  validateParams 
} from "../middlewares/validator";
import { 
  appCreateController, 
  appListController, 
  appGetController, 
  appUpdateController, 
  appDeleteController, 
  appCreateUserController, 
  changeAppSecretController
} from "../controllers/app.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post(
  "/",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 5,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`,
  }),
  validateBody(createAppSchema),
  appCreateController
);

router.post(
  "/users",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`
  }),
  validateBody(createUserAppSchema),
  appCreateUserController
);

router.get(
  "/",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 60,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`
  }),
  validateQuery(appsFilterQuerySchema),
  appListController
);

router.get(
  "/:id",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 120,
  }),
  authenticateAppController,
  validateParams(appIdParam),
  appGetController
);

router.put(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`,
  }),
  validateParams(appIdParam),
  validateBody(updateAppSchema),
  appUpdateController
);

router.patch(
  "/change-secret",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 3,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`
  }),
  validateBody(changeAppsSecretSchema),
  changeAppSecretController
);

router.delete(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 2,
    keyGenerator: (req) => `user:${req.headers['x-user-id']}device:${req.headers['x-device-id']}`
  }),
  validateParams(appIdParam),
  appDeleteController
);
// router.delete('/' validateQuery(appsFilterQuerySearch), appDeleteallController);

export default router;
