import { supabaseAdmin } from "../config/supabase.js";

/**
 * Admin middleware
 * Checks if the authenticated user has admin privileges
 * Must be used after authenticate middleware
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Fetch user profile to check admin status
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({
        success: false,
        message: "User profile not found.",
      });
    }

    if (!profile.is_admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization check failed.",
    });
  }
};
