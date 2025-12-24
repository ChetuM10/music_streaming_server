import express from "express";
import * as favoriteController from "../controllers/favorite.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.get("/", authenticate, favoriteController.getFavorites);
router.post("/:trackId", authenticate, favoriteController.addFavorite);
router.delete("/:trackId", authenticate, favoriteController.removeFavorite);
router.get("/check/:trackId", authenticate, favoriteController.checkFavorite);

export default router;
