import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import { config } from "./config/env.js";
import { supabaseStatus } from "./config/supabase.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import {
  generalLimiter,
  authLimiter,
  searchLimiter,
  uploadLimiter,
} from "./middleware/rateLimiter.js";
import { getStats as getCacheStats } from "./utils/cache.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import trackRoutes from "./routes/track.routes.js";
import podcastRoutes from "./routes/podcast.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import historyRoutes from "./routes/history.routes.js";
import searchRoutes from "./routes/search.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";
import gdprRoutes from "./routes/gdpr.routes.js";
import artistRoutes from "./routes/artist.routes.js";
import externalRoutes from "./routes/external.routes.js";
import { setupSwagger } from "./swagger.js";

const app = express();

// ================================
// SENTRY ERROR MONITORING
// ================================
if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.nodeEnv,
    tracesSampleRate: config.nodeEnv === "production" ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration({ app }),
    ],
  });
  console.log("✅ Sentry error monitoring initialized");
}

// ================================
// MIDDLEWARE
// ================================

// CORS configuration
const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

app.use(
  cors({
    origin: function (origin, callback) {
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

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter to all routes
app.use(generalLimiter);

// ================================
// HEALTH & STATUS ENDPOINTS
// ================================

app.get("/api/health", (req, res) => {
  const cacheStats = getCacheStats();
  res.json({
    success: true,
    message: "Music Streaming API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    cache: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      keys: cacheStats.keys,
    },
  });
});

// ================================
// API ROUTES
// ================================

// Auth routes with stricter rate limiting
app.use("/api/auth", authLimiter, authRoutes);

// Regular API routes
app.use("/api/tracks", trackRoutes);
app.use("/api/podcasts", podcastRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/history", historyRoutes);

// Search with dedicated limiter
app.use("/api/search", searchLimiter, searchRoutes);

// Upload with dedicated limiter
app.use("/api/upload", uploadLimiter, uploadRoutes);

// Analytics routes
app.use("/api/analytics", analyticsRoutes);

// Recommendations routes (personalized suggestions)
app.use("/api/recommendations", recommendationsRoutes);

// GDPR compliance routes
app.use("/api/user", gdprRoutes);

// Artist routes (multi-tenancy)
app.use("/api/artist", artistRoutes);

// External API routes (MusicBrainz, TheAudioDB, PodcastIndex)
app.use("/api/external", externalRoutes);

// Setup Swagger docs
setupSwagger(app);

// ================================
// ERROR HANDLING
// ================================

// Sentry error handler (must be before other error handlers)
if (config.sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(notFound);
app.use(errorHandler);

// ================================
// START SERVER WITH WEBSOCKET
// ================================

import { createServer } from "http";
import { initializeSocketServer } from "./websocket.js";

const PORT = config.port;
const httpServer = createServer(app);

// Initialize WebSocket server
initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`
  🎵 Music Streaming Server
  ========================
  Environment: ${config.nodeEnv}
  Port: ${PORT}
  Client URL: ${config.clientUrl}
  Supabase: ${supabaseStatus.message}
  Rate Limiting: ✅ Enabled
  Caching: ✅ Enabled
  WebSocket: ✅ Enabled
  Sentry: ${config.sentryDsn ? "✅ Enabled" : "⚠️ Not configured"}
  
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
  - Analytics: http://localhost:${PORT}/api/analytics
  - WebSocket: ws://localhost:${PORT}
  `);
});

export default app;
