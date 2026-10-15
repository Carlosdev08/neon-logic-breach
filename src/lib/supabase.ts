import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const isOnlineConfigured = Boolean(url && key);
let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!isOnlineConfigured || !url || !key) return null;
  if (!client)
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  return client;
}
