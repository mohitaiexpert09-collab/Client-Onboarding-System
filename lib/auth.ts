import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Role } from "@/lib/types";

/**
 * Auth + multi-tenancy helpers. Single place to resolve the current user and
 * their active org so all data access is tenant-scoped.
 *
 * `getCurrentUser` and `getContext` are wrapped in React `cache()` so that even
 * if multiple server components / helpers call them during one request, the
 * underlying Supabase round-trips happen only once. This removes the redundant
 * `getUser()` calls that previously made every navigation slow.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface CurrentContext {
  userId: string;
  email: string | null;
  org: Organization;
  role: Role;
}

/**
 * Resolves the signed-in user, their first org membership, and role.
 * Returns null if not authenticated or not yet in an org. Deduplicated per
 * request so repeated calls cost nothing.
 */
export const getContext = cache(async (): Promise<CurrentContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, org_id, organizations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organizations) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    org: membership.organizations as unknown as Organization,
    role: membership.role as Role,
  };
});

/**
 * For server components/actions in the dashboard: returns the context or
 * redirects. Sends authenticated-but-org-less users to onboarding.
 *
 * Reuses the cached `getCurrentUser`/`getContext` so this performs a single
 * `getUser()` + a single membership query per request — not three.
 */
export async function requireContext(): Promise<CurrentContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}
