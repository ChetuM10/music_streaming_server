import express from "express";
import * as playlistController from "../controllers/playlist.controller.js";
import { authenticate } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Get public playlists (optional auth to check ownership)
router.get("/public", optionalAuth, playlistController.getPublicPlaylists);

// Protected routes - require authentication
router.get("/", authenticate, playlistController.getUserPlaylists);
router.get("/:id", authenticate, playlistController.getPlaylistById);
router.post("/", authenticate, playlistController.createPlaylist);
router.put("/:id", authenticate, playlistController.updatePlaylist);
router.delete("/:id", authenticate, playlistController.deletePlaylist);

// Playlist tracks management
router.post("/:id/tracks", authenticate, playlistController.addTrackToPlaylist);
router.delete(
  "/:id/tracks/:trackId",
  authenticate,
  playlistController.removeTrackFromPlaylist
);
router.put(
  "/:id/tracks/reorder",
  authenticate,
  playlistController.reorderTracks
);

export default router;
