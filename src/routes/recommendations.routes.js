import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";
import cacheUtil from "../utils/cache.js";

const router = express.Router();

/**
 * Recommendation Engine
 *
 * Implements two types of filtering:
 * 1. Collaborative Filtering: "Users who liked X also liked Y"
 * 2. Content-Based Filtering: Genre/artist similarity
 *
 * This shows algorithmic thinking for resume projects.
 */

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized recommendations for the user
 * @access  Private
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const cacheKey = `recommendations:${userId}`;

    const recommendations = await cacheUtil.getOrSet(
      cacheKey,
      async () => {
        // Get user's liked tracks
        const { data: favorites } = await supabaseAdmin
          .from("favorites")
          .select("track_id, tracks(genre, artist)")
          .eq("user_id", userId)
          .limit(50);

        if (!favorites || favorites.length === 0) {
          // No favorites - return popular tracks
          return await getPopularTracks(limit, userId);
        }

        // Extract user's preferred genres and artists
        const preferredGenres = new Map();
        const preferredArtists = new Map();

        favorites.forEach((fav) => {
          if (fav.tracks?.genre) {
            preferredGenres.set(
              fav.tracks.genre,
              (preferredGenres.get(fav.tracks.genre) || 0) + 1
            );
          }
          if (fav.tracks?.artist) {
            preferredArtists.set(
              fav.tracks.artist,
              (preferredArtists.get(fav.tracks.artist) || 0) + 1
            );
          }
        });

        // Get top genres and artists
        const topGenres = [...preferredGenres.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genre]) => genre);

        const topArtists = [...preferredArtists.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([artist]) => artist);

        // Get user's already liked track IDs
        const likedTrackIds = favorites.map((f) => f.track_id);

        // Collaborative filtering: Find tracks liked by users with similar taste
        const collaborativeRecs = await getCollaborativeRecommendations(
          likedTrackIds,
          userId,
          Math.ceil(limit / 2)
        );

        // Content-based filtering: Find tracks with similar genre/artist
        const contentBasedRecs = await getContentBasedRecommendations(
          topGenres,
          topArtists,
          likedTrackIds,
          Math.ceil(limit / 2)
        );

        // Combine and deduplicate
        const allRecs = [...collaborativeRecs, ...contentBasedRecs];
        const uniqueRecs = [];
        const seenIds = new Set();

        for (const track of allRecs) {
          if (!seenIds.has(track.id)) {
            seenIds.add(track.id);
            uniqueRecs.push(track);
          }
        }

        return uniqueRecs.slice(0, limit);
      },
      300 // 5 minute cache
    );

    res.json({
      success: true,
      data: {
        recommendations,
        algorithm: "hybrid (collaborative + content-based)",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Collaborative Filtering
 * "Users who liked tracks you like, also liked these tracks"
 */
async function getCollaborativeRecommendations(likedTrackIds, userId, limit) {
  if (likedTrackIds.length === 0) return [];

  try {
    // Find users who liked the same tracks
    const { data: similarUsers } = await supabaseAdmin
      .from("favorites")
      .select("user_id")
      .in("track_id", likedTrackIds.slice(0, 10))
      .neq("user_id", userId)
      .limit(50);

    if (!similarUsers || similarUsers.length === 0) return [];

    const similarUserIds = [...new Set(similarUsers.map((u) => u.user_id))];

    // Get tracks that similar users liked (but current user hasn't)
    const { data: recommendedTracks } = await supabaseAdmin
      .from("favorites")
      .select(
        `
        track_id,
        tracks (*)
      `
      )
      .in("user_id", similarUserIds)
      .not("track_id", "in", `(${likedTrackIds.join(",")})`)
      .limit(limit * 2);

    if (!recommendedTracks) return [];

    // Count how many similar users liked each track (popularity score)
    const trackScores = new Map();

    recommendedTracks.forEach((rec) => {
      if (rec.tracks) {
        const current = trackScores.get(rec.track_id) || {
          track: rec.tracks,
          score: 0,
        };
        current.score += 1;
        trackScores.set(rec.track_id, current);
      }
    });

    // Sort by score and return tracks
    const sorted = [...trackScores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        ...item.track,
        recommendation_type: "collaborative",
        recommendation_reason: "Users with similar taste enjoyed this",
      }));

    return sorted;
  } catch (error) {
    console.error("Collaborative filtering error:", error);
    return [];
  }
}

/**
 * Content-Based Filtering
 * Find tracks with similar genre and artist
 */
async function getContentBasedRecommendations(
  topGenres,
  topArtists,
  excludeIds,
  limit
) {
  try {
    let query = supabaseAdmin.from("tracks").select("*");

    // Filter by preferred genres or artists
    if (topGenres.length > 0 && topArtists.length > 0) {
      query = query.or(
        `genre.in.(${topGenres
          .map((g) => `"${g}"`)
          .join(",")}),artist.in.(${topArtists.map((a) => `"${a}"`).join(",")})`
      );
    } else if (topGenres.length > 0) {
      query = query.in("genre", topGenres);
    } else if (topArtists.length > 0) {
      query = query.in("artist", topArtists);
    }

    // Exclude already liked tracks
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data: tracks } = await query
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (!tracks) return [];

    // Score tracks based on genre and artist match
    const scoredTracks = tracks.map((track) => {
      let score = 0;
      if (topGenres.includes(track.genre)) score += 2;
      if (topArtists.includes(track.artist)) score += 3;
      return { ...track, score };
    });

    // Sort by score and format
    return scoredTracks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((track) => ({
        ...track,
        recommendation_type: "content-based",
        recommendation_reason: topArtists.includes(track.artist)
          ? `Because you like ${track.artist}`
          : `Based on your taste in ${track.genre}`,
      }));
  } catch (error) {
    console.error("Content-based filtering error:", error);
    return [];
  }
}

/**
 * Fallback: Get Popular Tracks
 */
async function getPopularTracks(limit, excludeUserId) {
  try {
    // Get tracks with most favorites
    const { data: popularFavorites } = await supabaseAdmin
      .from("favorites")
      .select("track_id, tracks(*)")
      .limit(100);

    if (!popularFavorites) return [];

    // Count favorites per track
    const trackCounts = new Map();

    popularFavorites.forEach((fav) => {
      if (fav.tracks) {
        const current = trackCounts.get(fav.track_id) || {
          track: fav.tracks,
          count: 0,
        };
        current.count += 1;
        trackCounts.set(fav.track_id, current);
      }
    });

    // Sort by popularity
    return [...trackCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((item) => ({
        ...item.track,
        recommendation_type: "popular",
        recommendation_reason: "Trending now",
      }));
  } catch (error) {
    console.error("Popular tracks error:", error);
    return [];
  }
}

/**
 * @route   GET /api/recommendations/similar/:trackId
 * @desc    Get tracks similar to a specific track
 * @access  Private
 */
router.get("/similar/:trackId", authenticate, async (req, res, next) => {
  try {
    const { trackId } = req.params;
    const { limit = 6 } = req.query;

    // Get the source track
    const { data: sourceTrack } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .eq("id", trackId)
      .single();

    if (!sourceTrack) {
      return res.status(404).json({
        success: false,
        message: "Track not found",
      });
    }

    // Find similar tracks (same genre or artist)
    const { data: similar } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .or(`genre.eq.${sourceTrack.genre},artist.eq.${sourceTrack.artist}`)
      .neq("id", trackId)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        sourceTrack: { id: sourceTrack.id, title: sourceTrack.title },
        similar: similar || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
