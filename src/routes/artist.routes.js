import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Artist Routes
 *
 * Multi-tenancy system for artist accounts:
 * - Artist registration
 * - Profile management
 * - Music uploads
 * - Analytics dashboard
 */

/**
 * @route   POST /api/artist/register
 * @desc    Register as an artist
 * @access  Private
 */
router.post("/register", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { artist_name, bio } = req.body;

    if (!artist_name) {
      return res.status(400).json({
        success: false,
        message: "Artist name is required",
      });
    }

    // Check if already an artist
    const { data: existing } = await supabaseAdmin
      .from("artist_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You are already registered as an artist",
      });
    }

    // Create artist profile
    const { data: artist, error } = await supabaseAdmin
      .from("artist_profiles")
      .insert({
        user_id: userId,
        artist_name,
        bio: bio || "",
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Artist profile created! You can now upload music.",
      data: artist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/artist/profile
 * @desc    Get artist profile
 * @access  Private
 */
router.get("/profile", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: artist, error } = await supabaseAdmin
      .from("artist_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found. Register as an artist first.",
      });
    }

    res.json({
      success: true,
      data: artist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/artist/profile
 * @desc    Update artist profile
 * @access  Private (Artist only)
 */
router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      artist_name,
      bio,
      profile_image,
      banner_image,
      website,
      social_links,
    } = req.body;

    const { data: artist, error } = await supabaseAdmin
      .from("artist_profiles")
      .update({
        artist_name,
        bio,
        profile_image,
        banner_image,
        website,
        social_links,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: artist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/artist/dashboard
 * @desc    Get artist dashboard analytics
 * @access  Private (Artist only)
 */
router.get("/dashboard", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get artist profile
    const { data: artist } = await supabaseAdmin
      .from("artist_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    // Get artist's tracks
    const { data: tracks } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .eq("artist_id", artist.id);

    // Calculate stats
    const totalPlays =
      tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
    const totalTracks = tracks?.length || 0;

    // Get follower count
    const { count: followerCount } = await supabaseAdmin
      .from("artist_followers")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artist.id);

    // Get recent plays (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentAnalytics } = await supabaseAdmin
      .from("artist_analytics")
      .select("*")
      .eq("artist_id", artist.id)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    res.json({
      success: true,
      data: {
        profile: artist,
        stats: {
          total_plays: totalPlays,
          total_tracks: totalTracks,
          followers: followerCount || 0,
          monthly_listeners: artist.monthly_listeners || 0,
        },
        tracks: tracks || [],
        analytics: recentAnalytics || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/artist/tracks
 * @desc    Upload a new track (artist only)
 * @access  Private (Artist only)
 */
router.post("/tracks", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, album, genre, duration, audio_url, cover_url } = req.body;

    // Get artist profile
    const { data: artist } = await supabaseAdmin
      .from("artist_profiles")
      .select("id, artist_name")
      .eq("user_id", userId)
      .single();

    if (!artist) {
      return res.status(403).json({
        success: false,
        message: "Only artists can upload tracks. Register as an artist first.",
      });
    }

    if (!title || !audio_url) {
      return res.status(400).json({
        success: false,
        message: "Title and audio_url are required",
      });
    }

    // Create track
    const { data: track, error } = await supabaseAdmin
      .from("tracks")
      .insert({
        title,
        artist: artist.artist_name,
        artist_id: artist.id,
        album: album || "Single",
        genre: genre || "Other",
        duration: duration || 0,
        audio_url,
        cover_url,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Track uploaded successfully!",
      data: track,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/artist/:artistId
 * @desc    Get public artist profile
 * @access  Public
 */
router.get("/:artistId", async (req, res, next) => {
  try {
    const { artistId } = req.params;

    const { data: artist } = await supabaseAdmin
      .from("artist_profiles")
      .select("*")
      .eq("id", artistId)
      .single();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    // Get artist's tracks
    const { data: tracks } = await supabaseAdmin
      .from("tracks")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });

    res.json({
      success: true,
      data: {
        ...artist,
        tracks: tracks || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/artist/:artistId/follow
 * @desc    Follow an artist
 * @access  Private
 */
router.post("/:artistId/follow", authenticate, async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin.from("artist_followers").insert({
      artist_id: artistId,
      user_id: userId,
    });

    if (error && error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Already following this artist",
      });
    }

    if (error) throw error;

    // Update follower count
    await supabaseAdmin.rpc("increment_follower_count", {
      artist_id: artistId,
    });

    res.json({
      success: true,
      message: "Now following artist",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
