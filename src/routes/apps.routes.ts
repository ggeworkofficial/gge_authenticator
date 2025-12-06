import { Router } from "express";
import {
  createAppSchema,
  updateAppSchema,
  appsFilterQuerySchema,
  appIdParam
} from "../validators/apps.validator";
import { createUserAppSchema } from "../validators/apps.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";
import { appCreateController, appListController, appGetController, appUpdateController, appDeleteController, appCreateUserController } from "../controllers/app.controller";

const router = Router();

router.post("/", validateBody(createAppSchema), appCreateController);
router.get("/", validateQuery(appsFilterQuerySchema), appListController);
router.get("/:id", validateParams(appIdParam), appGetController);
router.put("/:id", validateParams(appIdParam), validateBody(updateAppSchema), appUpdateController);
router.delete("/:id", validateParams(appIdParam), appDeleteController);
router.post("/users", validateBody(createUserAppSchema), appCreateUserController);

export default router;
