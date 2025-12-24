import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

// Check if Supabase is configured
const isSupabaseConfigured =
  config.supabase.url &&
  config.supabase.url !== "your_supabase_project_url" &&
  config.supabase.anonKey &&
  config.supabase.anonKey !== "your_supabase_anon_key";

// Client for public operations (uses anon key)
export const supabase = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.anonKey)
  : null;

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin =
  isSupabaseConfigured && config.supabase.serviceRoleKey
    ? createClient(config.supabase.url, config.supabase.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Export status
export const supabaseStatus = {
  isConfigured: isSupabaseConfigured,
  message: isSupabaseConfigured
    ? "Supabase connected"
    : "Warning: Supabase not configured. Add credentials to .env file.",
};
