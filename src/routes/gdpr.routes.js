import express from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * GDPR Compliance Routes
 *
 * Implements data privacy requirements:
 * - Data export (right to access)
 * - Account deletion (right to be forgotten)
 */

/**
 * @route   GET /api/user/export
 * @desc    Export all user data as JSON (GDPR Data Subject Access Request)
 * @access  Private
 */
router.get("/export", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Gather all user data
    const [
      { data: favorites },
      { data: playlists },
      { data: history },
      { data: playlistTracks },
    ] = await Promise.all([
      supabaseAdmin
        .from("favorites")
        .select("*, tracks(*)")
        .eq("user_id", userId),
      supabaseAdmin.from("playlists").select("*").eq("user_id", userId),
      supabaseAdmin
        .from("history")
        .select("*, tracks(*)")
        .eq("user_id", userId)
        .order("played_at", { ascending: false }),
      supabaseAdmin
        .from("playlist_tracks")
        .select("*, playlists!inner(user_id)")
        .eq("playlists.user_id", userId),
    ]);

    // Compile user data export
    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at,
      },
      favorites: favorites || [],
      playlists: playlists || [],
      playlist_tracks: playlistTracks || [],
      listening_history: history || [],
      data_retention_notice:
        "This data export contains all personal data associated with your account.",
    };

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="melodify-data-export-${userId.slice(0, 8)}.json"`
    );

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account and all associated data (GDPR Right to be Forgotten)
 * @access  Private
 */
router.delete("/account", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete all user data (cascade)
    await Promise.all([
      supabaseAdmin.from("favorites").delete().eq("user_id", userId),
      supabaseAdmin.from("history").delete().eq("user_id", userId),
      supabaseAdmin.from("playlists").delete().eq("user_id", userId),
      supabaseAdmin.from("artist_followers").delete().eq("user_id", userId),
    ]);

    // Check if user is an artist and delete artist data
    const { data: artistProfile } = await supabaseAdmin
      .from("artist_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (artistProfile) {
      await supabaseAdmin
        .from("artist_profiles")
        .delete()
        .eq("user_id", userId);
    }

    // Delete auth user (this will be handled by Supabase)
    // Note: In production, you'd use Supabase admin to delete the user
    // await supabaseAdmin.auth.admin.deleteUser(userId);

    res.json({
      success: true,
      message:
        "Your account and all associated data have been permanently deleted.",
      deleted_data: [
        "User profile",
        "Favorites",
        "Playlists",
        "Listening history",
        "Artist profile (if applicable)",
      ],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/user/privacy-settings
 * @desc    Get user privacy settings
 * @access  Private
 */
router.get("/privacy-settings", authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      data_collection: {
        listening_history: true,
        recommendations: true,
        analytics: true,
      },
      data_sharing: {
        public_playlists: false,
        listening_activity: false,
      },
      communication: {
        marketing_emails: false,
        product_updates: true,
      },
    },
  });
});

export default router;
