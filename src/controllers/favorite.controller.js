import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get user's favorites
 */
export const getFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: favorites,
      error,
      count,
    } = await supabaseAdmin
      .from("favorites")
      .select(
        `
        *,
        tracks (*)
      `,
        { count: "exact" }
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Extract tracks from favorites
    const tracks = favorites.map((f) => ({
      ...f.tracks,
      favorited_at: f.created_at,
    }));

    res.json({
      success: true,
      data: {
        tracks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add track to favorites
 */
export const addFavorite = async (req, res, next) => {
  try {
    const { trackId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("favorites")
      .insert({
        user_id: req.user.id,
        track_id: trackId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Track already in favorites.",
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Track added to favorites.",
      data: { favorite: data },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove track from favorites
 */
export const removeFavorite = async (req, res, next) => {
  try {
    const { trackId } = req.params;

    const { error } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", req.user.id)
      .eq("track_id", trackId);

    if (error) throw error;

    res.json({
      success: true,
      message: "Track removed from favorites.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if track is favorited
 */
export const checkFavorite = async (req, res, next) => {
  try {
    const { trackId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("track_id", trackId)
      .single();

    res.json({
      success: true,
      data: { isFavorited: !!data },
    });
  } catch (error) {
    next(error);
  }
};
