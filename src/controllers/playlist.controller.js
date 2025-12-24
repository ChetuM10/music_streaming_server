import { supabaseAdmin } from "../config/supabase.js";

/**
 * Get user's playlists
 */
export const getUserPlaylists = async (req, res, next) => {
  try {
    const { data: playlists, error } = await supabaseAdmin
      .from("playlists")
      .select(
        `
        *,
        playlist_tracks (count)
      `
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Format response
    const formattedPlaylists = playlists.map((p) => ({
      ...p,
      track_count: p.playlist_tracks?.[0]?.count || 0,
    }));

    res.json({
      success: true,
      data: { playlists: formattedPlaylists },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public playlists
 */
export const getPublicPlaylists = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: playlists,
      error,
      count,
    } = await supabaseAdmin
      .from("playlists")
      .select(
        `
        *,
        profiles (username, avatar_url),
        playlist_tracks (count)
      `,
        { count: "exact" }
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        playlists,
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
 * Get playlist by ID with tracks
 */
export const getPlaylistById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get playlist
    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .select(
        `
        *,
        profiles (username, avatar_url)
      `
      )
      .eq("id", id)
      .single();

    if (error || !playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found.",
      });
    }

    // Check access
    if (!playlist.is_public && playlist.user_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Get playlist tracks
    const { data: playlistTracks } = await supabaseAdmin
      .from("playlist_tracks")
      .select(
        `
        *,
        tracks (*)
      `
      )
      .eq("playlist_id", id)
      .order("position", { ascending: true });

    playlist.tracks =
      playlistTracks?.map((pt) => ({
        ...pt.tracks,
        added_at: pt.added_at,
        position: pt.position,
      })) || [];

    res.json({
      success: true,
      data: { playlist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new playlist
 */
export const createPlaylist = async (req, res, next) => {
  try {
    const { name, description, cover_url, is_public = false } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Playlist name is required.",
      });
    }

    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .insert({
        user_id: req.user.id,
        name,
        description,
        cover_url,
        is_public,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Playlist created successfully.",
      data: { playlist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a playlist
 */
export const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, cover_url, is_public } = req.body;

    // Check ownership
    const { data: existing } = await supabaseAdmin
      .from("playlists")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (cover_url) updateData.cover_url = cover_url;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data: playlist, error } = await supabaseAdmin
      .from("playlists")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Playlist updated successfully.",
      data: { playlist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabaseAdmin
      .from("playlists")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const { error } = await supabaseAdmin
      .from("playlists")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Playlist deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add track to playlist
 */
export const addTrackToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { track_id } = req.body;

    if (!track_id) {
      return res.status(400).json({
        success: false,
        message: "track_id is required.",
      });
    }

    // Check ownership
    const { data: playlist } = await supabaseAdmin
      .from("playlists")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Get next position
    const { data: lastTrack } = await supabaseAdmin
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", id)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastTrack?.position || 0) + 1;

    const { data: playlistTrack, error } = await supabaseAdmin
      .from("playlist_tracks")
      .insert({
        playlist_id: id,
        track_id,
        position: nextPosition,
      })
      .select(
        `
        *,
        tracks (*)
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message: "Track already in playlist.",
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Track added to playlist.",
      data: { track: playlistTrack },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove track from playlist
 */
export const removeTrackFromPlaylist = async (req, res, next) => {
  try {
    const { id, trackId } = req.params;

    // Check ownership
    const { data: playlist } = await supabaseAdmin
      .from("playlists")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const { error } = await supabaseAdmin
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", id)
      .eq("track_id", trackId);

    if (error) throw error;

    res.json({
      success: true,
      message: "Track removed from playlist.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder tracks in playlist
 */
export const reorderTracks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tracks } = req.body; // Array of { track_id, position }

    // Check ownership
    const { data: playlist } = await supabaseAdmin
      .from("playlists")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!playlist || playlist.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Update positions
    for (const track of tracks) {
      await supabaseAdmin
        .from("playlist_tracks")
        .update({ position: track.position })
        .eq("playlist_id", id)
        .eq("track_id", track.track_id);
    }

    res.json({
      success: true,
      message: "Playlist reordered successfully.",
    });
  } catch (error) {
    next(error);
  }
};
