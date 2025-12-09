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

const router = Router();

router.post("/", validateBody(createDeviceSchema), deviceCreateController);

router.get("/", validateQuery(deviceFilterSchema), deviceListController);
router.get("/:id", validateParams(deviceIdParam), deviceGetController);

router.put("/:id", validateParams(deviceIdParam), validateBody(updateDeviceSchema), deviceUpdateController);

router.delete("/", validateQuery(deviceFilterSchema), deviceDeleteController);

export default router;
