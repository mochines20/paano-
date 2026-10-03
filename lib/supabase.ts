import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client — graceful kapag hindi pa naka-configure.
 * Bago i-deploy, i-set ang SUPABASE_URL at SUPABASE_ANON_KEY sa .env.local
 * at i-run ang supabase/schema.sql sa Supabase SQL editor.
 */

let client: SupabaseClient | null | undefined;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (client === undefined) {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
  }
  return client;
}

/** Service-role client for protected server/admin workflows only. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
