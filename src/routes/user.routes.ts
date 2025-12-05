import { Router } from "express";
import { validateBody, validateParams } from "../middlewares/validator";
import { createUserSchema, updateUserSchema, userIdParam } from "../validators/user.validator";

const router = Router();

router.get('/', );
router.get('/:id', validateParams(userIdParam) );
router.post('/', validateBody(createUserSchema));
router.put('/:id', validateParams(userIdParam), validateBody(updateUserSchema) );
router.delete('/:id', validateParams(userIdParam) );

export default router;