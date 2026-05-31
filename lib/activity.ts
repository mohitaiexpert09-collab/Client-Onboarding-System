import { createClient } from "@/lib/supabase/server";

/** Append an entry to a client's activity timeline (drives the dashboard feed). */
export async function logActivity(params: {
  orgId: string;
  clientId?: string | null;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("activity_log").insert({
    org_id: params.orgId,
    client_id: params.clientId ?? null,
    type: params.type,
    message: params.message,
    metadata: params.metadata ?? {},
  });
}
