import { Router } from "express";
import {
  createSessionSchema,
  updateSessionSchema,
  sessionIdParam,
  sessionFilterSchema,
} from "../validators/sessions.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";

const router = Router();


router.post("/", validateBody(createSessionSchema));
router.get("/", validateQuery(sessionFilterSchema));
router.get("/:id", validateParams(sessionIdParam));
router.put(
    "/:id", 
    validateParams(sessionIdParam), 
    validateBody(updateSessionSchema)
);
router.delete("/", validateQuery(sessionFilterSchema));

export default router;
