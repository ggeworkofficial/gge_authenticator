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

const router = Router();

router.post("/", validateBody(createAppSchema), appCreateController);
router.post("/users", validateBody(createUserAppSchema), appCreateUserController);

router.get("/", validateQuery(appsFilterQuerySchema), appListController);
router.get("/:id", validateParams(appIdParam), appGetController);

router.put("/:id", validateParams(appIdParam), validateBody(updateAppSchema), appUpdateController);
router.patch("/change-secret", validateBody(changeAppsSecretSchema), changeAppSecretController);

router.delete("/:id", validateParams(appIdParam), appDeleteController);
// router.delete('/' validateQuery(appsFilterQuerySearch), appDeleteallController);

export default router;
