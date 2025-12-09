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

const router = Router();

router.post("/", validateBody(createSessionSchema), createSessionController);

router.get("/", validateQuery(sessionFilterSchema), listSessionsController);
router.get("/:id", validateParams(sessionIdParam), getSessionController);

router.put("/:id", validateParams(sessionIdParam), validateBody(updateSessionSchema), updateSessionController);

router.delete("/", validateQuery(sessionFilterSchema), deleteSessionsController);
router.delete("/:id", validateParams(sessionIdParam), deleteSessionByIdController);

export default router;
