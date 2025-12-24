import { supabaseAdmin } from "../config/supabase.js";

/**
 * Search across tracks and podcasts
 */
export const search = async (req, res, next) => {
  try {
    const { q, type = "all", limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    const searchQuery = `%${q.trim()}%`;
    const results = {
      tracks: [],
      podcasts: [],
      episodes: [],
    };

    // Search tracks
    if (type === "all" || type === "tracks") {
      const { data: tracks } = await supabaseAdmin
        .from("tracks")
        .select("*")
        .or(
          `title.ilike.${searchQuery},artist.ilike.${searchQuery},album.ilike.${searchQuery}`
        )
        .limit(parseInt(limit));

      results.tracks = tracks || [];
    }

    // Search podcasts
    if (type === "all" || type === "podcasts") {
      const { data: podcasts } = await supabaseAdmin
        .from("podcasts")
        .select("*")
        .or(
          `title.ilike.${searchQuery},host.ilike.${searchQuery},description.ilike.${searchQuery}`
        )
        .limit(parseInt(limit));

      results.podcasts = podcasts || [];
    }

    // Search episodes
    if (type === "all" || type === "episodes") {
      const { data: episodes } = await supabaseAdmin
        .from("episodes")
        .select(
          `
          *,
          podcasts (*)
        `
        )
        .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
        .limit(parseInt(limit));

      results.episodes = episodes || [];
    }

    res.json({
      success: true,
      data: {
        query: q,
        results,
        total:
          results.tracks.length +
          results.podcasts.length +
          results.episodes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
