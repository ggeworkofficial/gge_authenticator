import { Router } from "express";
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceFilterSchema,
  deviceIdParam,
} from "../validators/device.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";
import {
  deviceCreateController,
  deviceListController,
  deviceGetController,
  deviceUpdateController,
  deviceDeleteController,
} from "../controllers/device.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticateAppController, validateBody(createDeviceSchema), deviceCreateController);

router.get("/", authenticateAppController, validateQuery(deviceFilterSchema), deviceListController); //admin only
router.get("/:id", authenticateMiddleware, validateParams(deviceIdParam), deviceGetController);

router.put("/:id", authenticateMiddleware, validateParams(deviceIdParam), validateBody(updateDeviceSchema), deviceUpdateController);

router.delete("/", authenticateMiddleware, validateQuery(deviceFilterSchema), deviceDeleteController);

export default router;
