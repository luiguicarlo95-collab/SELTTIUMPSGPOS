import { Router } from "express";
import * as authController from "../controllers/authController";
import { verifyToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { userSchema } from "../schemas/userSchema";

const router = Router();

router.post("/login", authController.login);
router.post("/register", validate(userSchema), authController.register);
router.get("/me", verifyToken, authController.getMe);

export default router;
