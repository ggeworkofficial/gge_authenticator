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
import { rateLimiter } from "../middlewares/rateLimiter";
import { authorizeIdentity } from "../middlewares/identityAuthorizer";
import { authenticateMiddleware } from "../middlewares/authenticator";
import { authenticateAppMiddleware } from "../middlewares/appAuthenticator";
import { isAdminMiddleware } from "../middlewares/adminChecker";

const router = Router();

router.post(
  "/",
  authenticateMiddleware,
  isAdminMiddleware,
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
  authorizeIdentity({
    allowAdmin: true,
    checkApp: true,
    checkUser: true
  }),
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
    keyGenerator: (req) => `user:${req.ip}`
  }),
  authenticateAppMiddleware,
  validateParams(appIdParam),
  appGetController
);

router.put(
  "/:id",
  authenticateMiddleware,
  isAdminMiddleware,
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
  isAdminMiddleware,
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
  isAdminMiddleware,
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
