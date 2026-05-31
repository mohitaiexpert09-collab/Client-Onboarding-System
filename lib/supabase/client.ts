import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/**
 * Supabase client for use in Client Components.
 * Uses the anon key + the browser's cookie-backed session, so all queries are
 * subject to Row Level Security (tenant isolation).
 */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
