import { supabaseAdmin } from "../config/supabase.js";
import cacheUtil from "../utils/cache.js";

/**
 * Get all tracks with pagination and caching
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

    // Create cache key based on query params
    const cacheKey = `${cacheUtil.CACHE_KEYS.TRACKS_LIST}:${page}:${limit}:${sort}:${order}`;

    const result = await cacheUtil.getOrSet(
      cacheKey,
      async () => {
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

        return {
          tracks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit),
          },
        };
      },
      cacheUtil.TTL.TRACKS_LIST
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unique genres with caching
 */
export const getGenres = async (req, res, next) => {
  try {
    const genres = await cacheUtil.getOrSet(
      cacheUtil.CACHE_KEYS.GENRES,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("tracks")
          .select("genre")
          .not("genre", "is", null);

        if (error) throw error;

        return [...new Set(data.map((item) => item.genre).filter(Boolean))];
      },
      cacheUtil.TTL.GENRES
    );

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

    const cacheKey = `${cacheUtil.CACHE_KEYS.TRACKS_LIST}:genre:${genre}:${page}:${limit}`;

    const result = await cacheUtil.getOrSet(
      cacheKey,
      async () => {
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

        return {
          tracks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit),
          },
        };
      },
      cacheUtil.TTL.TRACKS_LIST
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single track by ID with caching
 */
export const getTrackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const track = await cacheUtil.getOrSet(
      `${cacheUtil.CACHE_KEYS.TRACK_SINGLE}${id}`,
      async () => {
        const { data, error } = await supabaseAdmin
          .from("tracks")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) return null;
        return data;
      },
      cacheUtil.TTL.TRACK_SINGLE
    );

    if (!track) {
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

    // Invalidate tracks cache
    cacheUtil.invalidate("tracks");

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

    // Invalidate caches
    cacheUtil.invalidate("tracks");
    cacheUtil.del(`${cacheUtil.CACHE_KEYS.TRACK_SINGLE}${id}`);

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

    // Invalidate caches
    cacheUtil.invalidate("tracks");
    cacheUtil.del(`${cacheUtil.CACHE_KEYS.TRACK_SINGLE}${id}`);

    res.json({
      success: true,
      message: "Track deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
