const path = require("path");

// Load .env from the backend directory (works locally and on Render if set via dashboard)
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
// Fallback: project root
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  SUPABASE_URL or SUPABASE_ANON_KEY is missing. " +
      "Set them in backend/.env or as Render environment variables."
  );
}

/**
 * Public (anon) client – used for SELECT and for validating user JWTs.
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Admin client – uses the service-role key to bypass RLS.
 * Only available when SUPABASE_SERVICE_ROLE_KEY is set.
 */
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

module.exports = { supabase, adminSupabase };