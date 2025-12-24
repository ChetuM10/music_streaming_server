import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

// Client for public operations (uses anon key)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
