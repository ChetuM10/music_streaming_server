import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get all tracks with pagination
 */
export const getAllTracks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "created_at",
      order = "desc",
    } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: tracks,
      error,
      count,
    } = await supabaseAdmin
      .from("tracks")
      .select("*", { count: "exact" })
      .order(sort, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

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
 * Get unique genres
 */
export const getGenres = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tracks")
      .select("genre")
      .not("genre", "is", null);

    if (error) throw error;

    // Extract unique genres
    const genres = [...new Set(data.map((item) => item.genre).filter(Boolean))];

    res.json({
      success: true,
      data: { genres },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tracks by genre
 */
export const getTracksByGenre = async (req, res, next) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: tracks,
      error,
      count,
    } = await supabaseAdmin
      .from("tracks")
      .select("*", { count: "exact" })
      .eq("genre", genre)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

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
 * Get single track by ID
 */
export const getTrackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: track, error } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !track) {
      return res.status(404).json({
        success: false,
        message: "Track not found.",
      });
    }

    res.json({
      success: true,
      data: { track },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new track (Admin only)
 */
export const createTrack = async (req, res, next) => {
  try {
    const { title, artist, album, genre, duration, cover_url, audio_url } =
      req.body;

    if (!title || !artist || !audio_url) {
      return res.status(400).json({
        success: false,
        message: "Title, artist, and audio_url are required.",
      });
    }

    const { data: track, error } = await supabaseAdmin
      .from("tracks")
      .insert({
        title,
        artist,
        album,
        genre,
        duration,
        cover_url,
        audio_url,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Track created successfully.",
      data: { track },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a track (Admin only)
 */
export const updateTrack = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre, duration, cover_url, audio_url } =
      req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (artist) updateData.artist = artist;
    if (album) updateData.album = album;
    if (genre) updateData.genre = genre;
    if (duration) updateData.duration = duration;
    if (cover_url) updateData.cover_url = cover_url;
    if (audio_url) updateData.audio_url = audio_url;

    const { data: track, error } = await supabaseAdmin
      .from("tracks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Track updated successfully.",
      data: { track },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a track (Admin only)
 */
export const deleteTrack = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.from("tracks").delete().eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Track deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
