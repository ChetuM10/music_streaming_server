import express from "express";
import * as podcastController from "../controllers/podcast.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";

const router = express.Router();

// Public routes
router.get("/", podcastController.getAllPodcasts);
router.get("/categories", podcastController.getCategories);
router.get("/:id", podcastController.getPodcastById);
router.get("/:id/episodes", podcastController.getEpisodes);
router.get("/episodes/:episodeId", podcastController.getEpisodeById);

// Admin routes
router.post("/", authenticate, isAdmin, podcastController.createPodcast);
router.put("/:id", authenticate, isAdmin, podcastController.updatePodcast);
router.delete("/:id", authenticate, isAdmin, podcastController.deletePodcast);
router.post(
  "/:id/episodes",
  authenticate,
  isAdmin,
  podcastController.addEpisode
);
router.delete(
  "/episodes/:episodeId",
  authenticate,
  isAdmin,
  podcastController.deleteEpisode
);

export default router;
