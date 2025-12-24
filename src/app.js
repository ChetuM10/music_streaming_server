import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { supabaseStatus } from "./config/supabase.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import trackRoutes from "./routes/track.routes.js";
import podcastRoutes from "./routes/podcast.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import historyRoutes from "./routes/history.routes.js";
import searchRoutes from "./routes/search.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

// Middleware
// Allow multiple origins for development
const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Music Streaming API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/podcasts", podcastRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
  🎵 Music Streaming Server
  ========================
  Environment: ${config.nodeEnv}
  Port: ${PORT}
  Client URL: ${config.clientUrl}
  Supabase: ${supabaseStatus.message}
  
  API Endpoints:
  - Health: http://localhost:${PORT}/api/health
  - Auth: http://localhost:${PORT}/api/auth
  - Tracks: http://localhost:${PORT}/api/tracks
  - Podcasts: http://localhost:${PORT}/api/podcasts
  - Playlists: http://localhost:${PORT}/api/playlists
  - Favorites: http://localhost:${PORT}/api/favorites
  - History: http://localhost:${PORT}/api/history
  - Search: http://localhost:${PORT}/api/search
  - Upload: http://localhost:${PORT}/api/upload
  `);
});

export default app;
