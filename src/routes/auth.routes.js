import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Protected routes
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, authController.updateProfile);

export default router;
