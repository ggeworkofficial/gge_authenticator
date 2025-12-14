import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";
import { userCreateController, userListController, userGetController, userUpdateController, userDeleteController } from "../controllers/user.controller";
import { authenticateAppController } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticateAppController, validateBody(createUserSchema), userCreateController);

router.get("/", userListController);
router.get("/:id", validateParams(userIdParam), userGetController);

router.put("/:id", validateParams(userIdParam), validateBody(updateUserSchema), userUpdateController);

router.delete("/:id", validateParams(userIdParam), userDeleteController);

export default router;