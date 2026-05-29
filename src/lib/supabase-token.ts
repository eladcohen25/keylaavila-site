import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client scoped to a specific user's access token.
 * RLS policies run as that user (auth.uid() resolves to them), so writes are
 * correctly attributed and authorized. Use this in API routes that receive a
 * bearer token from the authenticated browser session.
 */
export function getSupabaseForToken(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
