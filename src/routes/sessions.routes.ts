import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import { createSessionSchema } from "../validators/sessions.validator";
import { createSessionController } from "../controllers/sessions.controller";

const router = Router();

// POST /sessions -> create session via controller
router.post("/", validateBody(createSessionSchema), createSessionController);

export default router;
