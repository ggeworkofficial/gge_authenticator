import { Router } from "express";
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceFilterSchema,
  deviceIdParam,
} from "../validators/device.validator";
import { validateBody, validateQuery, validateParams } from "../middlewares/validator";

const router = Router();

router.post("/", validateBody(createDeviceSchema));
router.get("/", validateQuery(deviceFilterSchema));
router.get("/:id", validateParams(deviceIdParam));
router.put(
  "/:id",
  validateParams(deviceIdParam),
  validateBody(updateDeviceSchema)
);
router.delete("/", validateQuery(deviceFilterSchema));

export default router;
