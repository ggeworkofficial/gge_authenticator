import { Router } from "express";
import { validate } from "../middlewares/validator";
import { registerSchema } from "../validators/registerValidator";

const router = Router();

router.post("/register", validate(registerSchema), (req, res) => {
  res.json({ message: "Registration validation passed" });
});

export default router;
