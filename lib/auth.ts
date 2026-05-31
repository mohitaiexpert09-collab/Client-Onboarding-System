import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Role } from "@/lib/types";

/**
 * Auth + multi-tenancy helpers. Single place to resolve the current user and
 * their active org so all data access is tenant-scoped.
 */

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface CurrentContext {
  userId: string;
  email: string | null;
  org: Organization;
  role: Role;
}

/**
 * Resolves the signed-in user, their first org membership, and role.
 * Returns null if not authenticated or not yet in an org.
 */
export async function getContext(): Promise<CurrentContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
}

/**
 * For server components/actions in the dashboard: returns the context or
 * redirects. Sends authenticated-but-org-less users to onboarding.
 */
export async function requireContext(): Promise<CurrentContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}
