import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import {
	registerSchema,
	loginSchema,
	refreshSchema,
	changePasswordSchema,
	verifiyEmailSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validateBody(registerSchema));
router.post("/login", validateBody(loginSchema));
router.post("/refresh", validateBody(refreshSchema));
router.post("/verify-email", validateBody(verifiyEmailSchema));
router.patch("/change-password", validateBody(changePasswordSchema));

export default router;
