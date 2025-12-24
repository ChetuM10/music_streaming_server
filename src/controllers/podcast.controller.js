import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get all podcasts
 */
export const getAllPodcasts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from("podcasts").select("*", { count: "exact" });

    if (category) {
      query = query.eq("category", category);
    }

    const {
      data: podcasts,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        podcasts,
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
 * Get unique categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("podcasts")
      .select("category")
      .not("category", "is", null);

    if (error) throw error;

    const categories = [
      ...new Set(data.map((item) => item.category).filter(Boolean)),
    ];

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get podcast by ID with episodes
 */
export const getPodcastById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: podcast, error } = await supabaseAdmin
      .from("podcasts")
      .select(
        `
        *,
        episodes (*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found.",
      });
    }

    // Sort episodes by episode number
    if (podcast.episodes) {
      podcast.episodes.sort((a, b) => a.episode_number - b.episode_number);
    }

    res.json({
      success: true,
      data: { podcast },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get episodes for a podcast
 */
export const getEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: episodes, error } = await supabaseAdmin
      .from("episodes")
      .select("*")
      .eq("podcast_id", id)
      .order("episode_number", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: { episodes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single episode by ID
 */
export const getEpisodeById = async (req, res, next) => {
  try {
    const { episodeId } = req.params;

    const { data: episode, error } = await supabaseAdmin
      .from("episodes")
      .select(
        `
        *,
        podcasts (*)
      `
      )
      .eq("id", episodeId)
      .single();

    if (error || !episode) {
      return res.status(404).json({
        success: false,
        message: "Episode not found.",
      });
    }

    res.json({
      success: true,
      data: { episode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new podcast (Admin only)
 */
export const createPodcast = async (req, res, next) => {
  try {
    const { title, host, description, cover_url, category } = req.body;

    if (!title || !host) {
      return res.status(400).json({
        success: false,
        message: "Title and host are required.",
      });
    }

    const { data: podcast, error } = await supabaseAdmin
      .from("podcasts")
      .insert({ title, host, description, cover_url, category })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Podcast created successfully.",
      data: { podcast },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a podcast (Admin only)
 */
export const updatePodcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, host, description, cover_url, category } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (host) updateData.host = host;
    if (description !== undefined) updateData.description = description;
    if (cover_url) updateData.cover_url = cover_url;
    if (category) updateData.category = category;

    const { data: podcast, error } = await supabaseAdmin
      .from("podcasts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Podcast updated successfully.",
      data: { podcast },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a podcast (Admin only)
 */
export const deletePodcast = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("podcasts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Podcast deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add episode to podcast (Admin only)
 */
export const addEpisode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, duration, audio_url, episode_number } =
      req.body;

    if (!title || !audio_url) {
      return res.status(400).json({
        success: false,
        message: "Title and audio_url are required.",
      });
    }

    const { data: episode, error } = await supabaseAdmin
      .from("episodes")
      .insert({
        podcast_id: id,
        title,
        description,
        duration,
        audio_url,
        episode_number,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Episode added successfully.",
      data: { episode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an episode (Admin only)
 */
export const deleteEpisode = async (req, res, next) => {
  try {
    const { episodeId } = req.params;

    const { error } = await supabaseAdmin
      .from("episodes")
      .delete()
      .eq("id", episodeId);

    if (error) throw error;

    res.json({
      success: true,
      message: "Episode deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
