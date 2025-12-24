import express from "express";
import * as historyController from "../controllers/history.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.get("/", authenticate, historyController.getRecentlyPlayed);
router.post("/", authenticate, historyController.addToHistory);
router.put("/:id/progress", authenticate, historyController.updateProgress);
router.delete("/", authenticate, historyController.clearHistory);

export default router;
