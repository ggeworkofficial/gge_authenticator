import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";
import { userCreateController, userListController, userGetController, userUpdateController, userDeleteController } from "../controllers/user.controller";
import { authenticateAppController, authenticateMiddleware } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticateAppController, validateBody(createUserSchema), userCreateController);

router.get("/", authenticateMiddleware, userListController); //admin usage only
router.get("/:id", authenticateMiddleware, validateParams(userIdParam), userGetController); //authenticate

router.put("/:id", authenticateMiddleware, validateParams(userIdParam), validateBody(updateUserSchema), userUpdateController); //authenticate

router.delete("/:id", authenticateMiddleware, validateParams(userIdParam), userDeleteController); //admin usage only

export default router;