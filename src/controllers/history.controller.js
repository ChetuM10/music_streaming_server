import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get recently played
 */
export const getRecentlyPlayed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const { data: history, error } = await supabaseAdmin
      .from("recently_played")
      .select(
        `
        *,
        tracks (*),
        episodes (
          *,
          podcasts (*)
        )
      `
      )
      .eq("user_id", req.user.id)
      .order("played_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Format response
    const items = history.map((h) => ({
      id: h.id,
      type: h.track_id ? "track" : "episode",
      content: h.track_id ? h.tracks : h.episodes,
      played_at: h.played_at,
      progress: h.progress,
    }));

    res.json({
      success: true,
      data: { history: items },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add to listening history
 */
export const addToHistory = async (req, res, next) => {
  try {
    const { track_id, episode_id, progress = 0 } = req.body;

    if (!track_id && !episode_id) {
      return res.status(400).json({
        success: false,
        message: "Either track_id or episode_id is required.",
      });
    }

    // Check if entry already exists and update it
    const query = supabaseAdmin
      .from("recently_played")
      .select("id")
      .eq("user_id", req.user.id);

    if (track_id) {
      query.eq("track_id", track_id);
    } else {
      query.eq("episode_id", episode_id);
    }

    const { data: existing } = await query.single();

    if (existing) {
      // Update existing entry
      const { data, error } = await supabaseAdmin
        .from("recently_played")
        .update({
          played_at: new Date().toISOString(),
          progress,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "History updated.",
        data: { history: data },
      });
    }

    // Create new entry
    const { data, error } = await supabaseAdmin
      .from("recently_played")
      .insert({
        user_id: req.user.id,
        track_id: track_id || null,
        episode_id: episode_id || null,
        progress,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Added to history.",
      data: { history: data },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update playback progress
 */
export const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
      return res.status(400).json({
        success: false,
        message: "Progress is required.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("recently_played")
      .update({ progress })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Progress updated.",
      data: { history: data },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear listening history
 */
export const clearHistory = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from("recently_played")
      .delete()
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "History cleared.",
    });
  } catch (error) {
    next(error);
  }
};
