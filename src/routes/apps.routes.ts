import { Router } from "express";
import {
  createAppSchema,
  updateAppSchema,
  appsFilterQuerySchema,
  appIdParam
} from "../validators/apps.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";

const router = Router();

router.post("/", validateBody(createAppSchema));
router.get("/", validateQuery(appsFilterQuerySchema));
router.get("/:id", validateParams(appIdParam));
router.put("/:id", validateParams(appIdParam), validateBody(updateAppSchema));
router.delete("/:id", validateParams(appIdParam));

export default router;
