import { Router } from "express";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";
import {
	createSessionSchema,
	updateSessionSchema,
	sessionIdParam,
	sessionFilterSchema,
} from "../validators/sessions.validator";
import {
	createSessionController,
	listSessionsController,
	getSessionController,
	updateSessionController,
	deleteSessionsController,
	deleteSessionByIdController,
} from "../controllers/sessions.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post(
  "/",
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
	keyGenerator: (req) => `session:${req.ip}`
  }),
  authenticateAppController,
  validateBody(createSessionSchema),
  createSessionController
);

/**
 * List sessions (admin)
 */
router.get(
  "/",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 30,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateQuery(sessionFilterSchema),
  listSessionsController
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
  validateParams(sessionIdParam),
  getSessionController
);

router.put(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 60,
    maxRequests: 20,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateParams(sessionIdParam),
  validateBody(updateSessionSchema),
  updateSessionController
);

router.delete(
  "/",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 3,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateQuery(sessionFilterSchema),
  deleteSessionsController
);

router.delete(
  "/:id",
  authenticateMiddleware,
  rateLimiter({
    windowSeconds: 300,
    maxRequests: 5,
    keyGenerator: (req) =>
      `user:${req.auth!.user_id}:device:${req.auth!.device_id}`,
  }),
  validateParams(sessionIdParam),
  deleteSessionByIdController
);

export default router;
