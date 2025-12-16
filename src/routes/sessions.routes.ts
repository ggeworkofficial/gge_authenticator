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

const router = Router();

router.post("/", authenticateAppController, validateBody(createSessionSchema), createSessionController);

router.get("/", authenticateMiddleware, validateQuery(sessionFilterSchema), listSessionsController); //admin
router.get("/:id", authenticateMiddleware, validateParams(sessionIdParam), getSessionController);

router.put("/:id", authenticateMiddleware, validateParams(sessionIdParam), validateBody(updateSessionSchema), updateSessionController);

router.delete("/", authenticateMiddleware, validateQuery(sessionFilterSchema), deleteSessionsController);
router.delete("/:id", authenticateMiddleware, validateParams(sessionIdParam), deleteSessionByIdController);

export default router;
