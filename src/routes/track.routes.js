import express from "express";
import * as trackController from "../controllers/track.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";

const router = express.Router();

// Public routes
router.get("/", trackController.getAllTracks);
router.get("/genres", trackController.getGenres);
router.get("/genre/:genre", trackController.getTracksByGenre);
router.get("/:id", trackController.getTrackById);

// Admin routes
router.post("/", authenticate, isAdmin, trackController.createTrack);
router.put("/:id", authenticate, isAdmin, trackController.updateTrack);
router.delete("/:id", authenticate, isAdmin, trackController.deleteTrack);

export default router;
