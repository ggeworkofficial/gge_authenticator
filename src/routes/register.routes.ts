import { Router } from "express";
import { validateBody } from "../middlewares/validator";
import { registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validateBody(registerSchema), (req, res) => {
  res.json({ message: "Registration validation passed" });
});

export default router;
