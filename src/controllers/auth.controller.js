import { supabase, supabaseAdmin } from "../config/supabase.js";

/**
 * Sign up a new user
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: username || email.split("@")[0],
          is_admin: false,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    res.status(201).json({
      success: true,
      message:
        "User created successfully. Please check your email to verify your account.",
      data: {
        user: authData.user,
        session: authData.session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in a user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          ...data.user,
          profile,
        },
        session: data.session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out a user
 */
export const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
export const getMe = async (req, res, next) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          ...req.user,
          profile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar_url } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (avatar_url) updateData.avatar_url = avatar_url;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { profile: data },
    });
  } catch (error) {
    next(error);
  }
};
