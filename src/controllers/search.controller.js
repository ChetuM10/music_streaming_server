import { supabaseAdmin } from "../config/supabase.js";
import cacheUtil from "../utils/cache.js";

/**
 * Search Controller
 *
 * Supports two modes:
 * 1. Standard ILIKE search (default)
 * 2. PostgreSQL Full-Text Search (when available)
 */

/**
 * Search across tracks and podcasts
 */
export const search = async (req, res, next) => {
  try {
    const { q, type = "all", limit = 20, mode = "standard" } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    const query = q.trim();
    const cacheKey = `${cacheUtil.CACHE_KEYS.SEARCH}${query}:${type}:${limit}`;

    const results = await cacheUtil.getOrSet(
      cacheKey,
      async () => {
        // Try full-text search first if mode is 'fts'
        if (mode === "fts") {
          return await fullTextSearch(query, type, parseInt(limit));
        }
        return await standardSearch(query, type, parseInt(limit));
      },
      cacheUtil.TTL.SEARCH
    );

    res.json({
      success: true,
      data: {
        query: q,
        results,
        total:
          (results.tracks?.length || 0) +
          (results.podcasts?.length || 0) +
          (results.episodes?.length || 0),
        mode: mode === "fts" ? "full-text" : "standard",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Standard ILIKE search
 */
async function standardSearch(query, type, limit) {
  const searchQuery = `%${query}%`;
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
        `title.ilike.${searchQuery},artist.ilike.${searchQuery},album.ilike.${searchQuery},genre.ilike.${searchQuery}`
      )
      .limit(limit);

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
      .limit(limit);

    results.podcasts = podcasts || [];
  }

  // Search episodes
  if (type === "all" || type === "episodes") {
    const { data: episodes } = await supabaseAdmin
      .from("podcast_episodes")
      .select(
        `
        *,
        podcasts (*)
      `
      )
      .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
      .limit(limit);

    results.episodes = episodes || [];
  }

  return results;
}

/**
 * PostgreSQL Full-Text Search
 * Uses tsvector and tsquery for better relevance ranking
 */
async function fullTextSearch(query, type, limit) {
  try {
    // Use the search_all function we created
    const { data, error } = await supabaseAdmin.rpc("search_all", {
      search_query: query,
      result_limit: limit,
    });

    if (error) {
      console.warn("Full-text search failed, falling back:", error);
      return await standardSearch(query, type, limit);
    }

    // Group results by type
    const results = {
      tracks: [],
      podcasts: [],
      episodes: [],
    };

    data?.forEach((item) => {
      const formatted = {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        cover_url: item.cover_url,
        rank: item.rank,
      };

      switch (item.type) {
        case "track":
          results.tracks.push({ ...formatted, artist: item.subtitle });
          break;
        case "podcast":
          results.podcasts.push({ ...formatted, host: item.subtitle });
          break;
        case "episode":
          results.episodes.push(formatted);
          break;
      }
    });

    return results;
  } catch (error) {
    console.warn("Full-text search error:", error);
    return await standardSearch(query, type, limit);
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export const suggestions = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const prefix = q.trim();

    // Try the PostgreSQL function first
    const { data, error } = await supabaseAdmin.rpc("search_suggestions", {
      prefix,
      suggestion_limit: parseInt(limit),
    });

    if (error || !data) {
      // Fallback: simple query
      const { data: tracks } = await supabaseAdmin
        .from("tracks")
        .select("title, artist")
        .or(`title.ilike.${prefix}%,artist.ilike.${prefix}%`)
        .limit(parseInt(limit));

      const suggestions = [];
      const seen = new Set();

      tracks?.forEach((t) => {
        if (
          t.title.toLowerCase().startsWith(prefix.toLowerCase()) &&
          !seen.has(t.title)
        ) {
          suggestions.push({ text: t.title, type: "track" });
          seen.add(t.title);
        }
        if (
          t.artist.toLowerCase().startsWith(prefix.toLowerCase()) &&
          !seen.has(t.artist)
        ) {
          suggestions.push({ text: t.artist, type: "artist" });
          seen.add(t.artist);
        }
      });

      return res.json({
        success: true,
        data: { suggestions: suggestions.slice(0, limit) },
      });
    }

    res.json({
      success: true,
      data: {
        suggestions: data.map((s) => ({
          text: s.suggestion,
          type: s.type,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
