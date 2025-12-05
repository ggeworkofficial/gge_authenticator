import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";
import { userCreateController, userListController, userGetController, userUpdateController, userDeleteController } from "../controllers/user.controller";

const router = Router();

router.get("/", userListController);
router.get("/:id", validateParams(userIdParam), userGetController);
router.post("/", validateBody(createUserSchema), userCreateController);
router.put("/:id", validateParams(userIdParam), validateBody(updateUserSchema), userUpdateController);
router.delete("/:id", validateParams(userIdParam), userDeleteController);

export default router;