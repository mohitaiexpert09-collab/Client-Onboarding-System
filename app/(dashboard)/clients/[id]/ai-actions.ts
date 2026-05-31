"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { draftContract, summarizeIntake, draftWeeklyUpdate } from "@/lib/ai";
import { STAGE_LABEL, type Client, type FormResponse, type ActivityEntry } from "@/lib/types";

export type AIResult = { text?: string; error?: string };

async function loadClient(clientId: string): Promise<{ orgId: string; orgName: string; client: Client } | null> {
  const ctx = await requireContext();
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", clientId).eq("org_id", ctx.org.id).single();
  if (!data) return null;
  return { orgId: ctx.org.id, orgName: ctx.org.name, client: data as Client };
}

/** Generate a contract draft from a prompt (returns text for inline display). */
export async function aiDraftContract(_prev: AIResult, formData: FormData): Promise<AIResult> {
  const clientId = String(formData.get("client_id"));
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!prompt) return { error: "Describe the engagement first." };

  const loaded = await loadClient(clientId);
  if (!loaded) return { error: "Client not found." };

  try {
    const text = await draftContract({ orgName: loaded.orgName, clientName: loaded.client.name, prompt });
    if (!text) return { error: "AI is not configured. Add OPENAI_API_KEY to .env.local." };
    return { text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}

/** Summarize the latest intake response into a brief, persisted on the client. */
export async function aiSummarizeIntake(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const loaded = await loadClient(clientId);
  if (!loaded) return;

  const supabase = await createClient();
  const { data: responses } = await supabase
    .from("form_responses")
    .select("*")
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: false })
    .limit(1);

  const latest = (responses?.[0] as FormResponse | undefined) ?? null;
  if (!latest) return;

  const brief = await summarizeIntake({ clientName: loaded.client.name, answers: latest.answers });
  if (!brief) return;

  await supabase
    .from("clients")
    .update({ ai_brief: brief, ai_brief_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("org_id", loaded.orgId);

  await logActivity({ orgId: loaded.orgId, clientId, type: "ai.summary", message: "AI brief generated from intake" });
  revalidatePath(`/clients/${clientId}`);
}

/** Draft a weekly client update from recent activity (returns text for inline display). */
export async function aiDraftWeeklyUpdate(_prev: AIResult, formData: FormData): Promise<AIResult> {
  const clientId = String(formData.get("client_id"));
  const loaded = await loadClient(clientId);
  if (!loaded) return { error: "Client not found." };

  const supabase = await createClient();
  const { data: activity } = await supabase
    .from("activity_log")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(15);

  const recent = (activity ?? []) as ActivityEntry[];
  const context =
    `Current stage: ${STAGE_LABEL[loaded.client.stage]}\n` +
    `Recent activity:\n${recent.map((a) => `- ${a.message}`).join("\n") || "- (no recent activity logged)"}`;

  try {
    const text = await draftWeeklyUpdate({ orgName: loaded.orgName, clientName: loaded.client.name, context });
    if (!text) return { error: "AI is not configured. Add OPENAI_API_KEY to .env.local." };
    return { text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Generation failed." };
  }
}
