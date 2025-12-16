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
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticateMiddleware, validateBody(createAppSchema), appCreateController); //admin only
router.post("/users", authenticateMiddleware, validateBody(createUserAppSchema), appCreateUserController); //This might need to collab with POST /apps

router.get("/", authenticateMiddleware, validateQuery(appsFilterQuerySchema), appListController);
router.get("/:id", authenticateAppController, validateParams(appIdParam), appGetController);

router.put("/:id", authenticateMiddleware, validateParams(appIdParam), validateBody(updateAppSchema), appUpdateController); //admin only
router.patch("/change-secret", authenticateMiddleware, validateBody(changeAppsSecretSchema), changeAppSecretController); //admin only

router.delete("/:id", authenticateMiddleware, validateParams(appIdParam), appDeleteController); //admin only
// router.delete('/' validateQuery(appsFilterQuerySearch), appDeleteallController);

export default router;
