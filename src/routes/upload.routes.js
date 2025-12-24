import express from "express";
import * as uploadController from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/admin.js";
import multer from "multer";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow audio and image files
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
    ];
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      allowedAudioTypes.includes(file.mimetype) ||
      allowedImageTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only audio and image files are allowed."),
        false
      );
    }
  },
});

// Admin only routes
router.post(
  "/audio",
  authenticate,
  isAdmin,
  upload.single("audio"),
  uploadController.uploadAudio
);
router.post(
  "/cover",
  authenticate,
  isAdmin,
  upload.single("cover"),
  uploadController.uploadCover
);

export default router;
