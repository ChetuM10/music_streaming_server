import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";
import cacheUtil from "../utils/cache.js";

const router = express.Router();

/**
 * @route   POST /api/analytics/play
 * @desc    Record a track play event
 * @access  Private
 */
router.post("/play", authenticate, async (req, res, next) => {
  try {
    const { track_id, duration_played, completed } = req.body;
    const user_id = req.user.id;

    // Insert play event
    const { error } = await supabaseAdmin.from("play_events").insert({
      user_id,
      track_id,
      duration_played: duration_played || 0,
      completed: completed || false,
      played_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error recording play:", error);
      // Don't fail the request, analytics are best-effort
      return res.json({
        success: true,
        message: "Play recorded (with errors)",
      });
    }

    // Invalidate stats cache
    cacheUtil.del(cacheUtil.CACHE_KEYS.STATS + "*");

    res.json({ success: true, message: "Play recorded" });
  } catch (error) {
    // Analytics should fail silently
    console.error("Analytics error:", error);
    res.json({ success: true, message: "Play recorded" });
  }
});

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get analytics dashboard data
 * @access  Private (Admin)
 */
router.get("/dashboard", authenticate, async (req, res, next) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (profile?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Use cache for dashboard stats
    const stats = await cacheUtil.getOrSet(
      cacheUtil.CACHE_KEYS.STATS + "dashboard",
      async () => {
        // Total plays today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: totalPlaysToday } = await supabaseAdmin
          .from("play_events")
          .select("*", { count: "exact", head: true })
          .gte("played_at", today.toISOString());

        // Total plays all time
        const { count: totalPlaysAllTime } = await supabaseAdmin
          .from("play_events")
          .select("*", { count: "exact", head: true });

        // Unique listeners today
        const { data: uniqueListeners } = await supabaseAdmin
          .from("play_events")
          .select("user_id")
          .gte("played_at", today.toISOString());

        const uniqueListenersToday = new Set(
          uniqueListeners?.map((e) => e.user_id) || []
        ).size;

        // Total users
        const { count: totalUsers } = await supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Total tracks
        const { count: totalTracks } = await supabaseAdmin
          .from("tracks")
          .select("*", { count: "exact", head: true });

        // Most played tracks (top 10)
        const { data: topTracks } = await supabaseAdmin
          .from("play_events")
          .select("track_id, tracks(title, artist, cover_url)")
          .limit(1000);

        // Count plays per track
        const trackPlayCounts = {};
        topTracks?.forEach((event) => {
          if (event.track_id) {
            trackPlayCounts[event.track_id] =
              (trackPlayCounts[event.track_id] || 0) + 1;
          }
        });

        // Sort and get top 10
        const sortedTracks = Object.entries(trackPlayCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const topTracksWithInfo = sortedTracks.map(([trackId, playCount]) => {
          const trackInfo = topTracks?.find((t) => t.track_id === trackId);
          return {
            track_id: trackId,
            play_count: playCount,
            title: trackInfo?.tracks?.title || "Unknown",
            artist: trackInfo?.tracks?.artist || "Unknown",
            cover_url: trackInfo?.tracks?.cover_url,
          };
        });

        // Genre distribution
        const { data: genreData } = await supabaseAdmin
          .from("tracks")
          .select("genre");

        const genreCounts = {};
        genreData?.forEach((track) => {
          if (track.genre) {
            genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
          }
        });

        const genreDistribution = Object.entries(genreCounts)
          .map(([genre, count]) => ({ genre, count }))
          .sort((a, b) => b.count - a.count);

        return {
          totalPlaysToday: totalPlaysToday || 0,
          totalPlaysAllTime: totalPlaysAllTime || 0,
          uniqueListenersToday,
          totalUsers: totalUsers || 0,
          totalTracks: totalTracks || 0,
          topTracks: topTracksWithInfo,
          genreDistribution,
        };
      },
      cacheUtil.TTL.STATS
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/track/:id
 * @desc    Get analytics for a specific track
 * @access  Private
 */
router.get("/track/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const stats = await cacheUtil.getOrSet(
      cacheUtil.CACHE_KEYS.STATS + `track:${id}`,
      async () => {
        const { count: totalPlays } = await supabaseAdmin
          .from("play_events")
          .select("*", { count: "exact", head: true })
          .eq("track_id", id);

        const { data: uniqueData } = await supabaseAdmin
          .from("play_events")
          .select("user_id")
          .eq("track_id", id);

        const uniqueListeners = new Set(uniqueData?.map((e) => e.user_id) || [])
          .size;

        // Completion rate
        const { count: completedPlays } = await supabaseAdmin
          .from("play_events")
          .select("*", { count: "exact", head: true })
          .eq("track_id", id)
          .eq("completed", true);

        return {
          totalPlays: totalPlays || 0,
          uniqueListeners,
          completionRate: totalPlays
            ? ((completedPlays || 0) / totalPlays) * 100
            : 0,
        };
      },
      cacheUtil.TTL.STATS
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
