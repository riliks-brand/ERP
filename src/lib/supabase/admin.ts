/**
 * Supabase Admin Client (Server-Side Only)
 *
 * Uses the SERVICE_ROLE key — bypasses RLS.
 * NEVER import this in client components or NEXT_PUBLIC_ code.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const STORAGE_BUCKET = "brands";
export const SIGNED_URL_TTL = 3600; // 1 hour in seconds
