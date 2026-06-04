import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Backed by the request cookies so the authenticated user's session is used and
 * RLS policies apply. `cookies()` is async in Next.js 16.
 *
 * Wrapped in React `cache()` so a single client (and one `cookies()` read) is
 * reused across every helper within the same request.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore when middleware refreshes the session.
        }
      },
    },
  });
});

/**
 * Privileged client using the service role key. BYPASSES Row Level Security —
 * only use in trusted server contexts (webhooks, Inngest functions, admin tasks)
 * and always scope queries by `org_id` manually. Never expose to the client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
