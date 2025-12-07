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

// Create
router.post("/", validateBody(createSessionSchema), createSessionController);

// List
router.get("/", validateQuery(sessionFilterSchema), listSessionsController);

// Get by id
router.get("/:id", validateParams(sessionIdParam), getSessionController);

// Update
router.put("/:id", validateParams(sessionIdParam), validateBody(updateSessionSchema), updateSessionController);

// Delete by filter
router.delete("/", validateQuery(sessionFilterSchema), deleteSessionsController);

// Delete by id
router.delete("/:id", validateParams(sessionIdParam), deleteSessionByIdController);

export default router;
