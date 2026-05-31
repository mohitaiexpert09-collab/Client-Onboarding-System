"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { STAGE_LABEL, type Stage } from "@/lib/types";

export async function createClientAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/clients?error=Name is required");

  const valueDollars = Number(formData.get("value") ?? 0);

  const { data, error } = await supabase
    .from("clients")
    .insert({
      org_id: ctx.org.id,
      name,
      email: String(formData.get("email") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      value_cents: Math.round((isNaN(valueDollars) ? 0 : valueDollars) * 100),
      notes: String(formData.get("notes") ?? "") || null,
    })
    .select("id")
    .single();

  if (error) redirect(`/clients?error=${encodeURIComponent(error.message)}`);

  await logActivity({
    orgId: ctx.org.id,
    clientId: data!.id,
    type: "client.created",
    message: `Client "${name}" was added`,
  });

  revalidatePath("/clients");
  redirect(`/clients/${data!.id}`);
}

export async function updateStageAction(clientId: string, stage: Stage) {
  const ctx = await requireContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ stage })
    .eq("id", clientId)
    .eq("org_id", ctx.org.id);
  if (error) return;

  await logActivity({
    orgId: ctx.org.id,
    clientId,
    type: "stage.changed",
    message: `Moved to "${STAGE_LABEL[stage]}"`,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function updateClientAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const valueDollars = Number(formData.get("value") ?? 0);
  await supabase
    .from("clients")
    .update({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      value_cents: Math.round((isNaN(valueDollars) ? 0 : valueDollars) * 100),
      notes: String(formData.get("notes") ?? "") || null,
      status: String(formData.get("status") ?? "active"),
    })
    .eq("id", id)
    .eq("org_id", ctx.org.id);

  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClientAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("clients").delete().eq("id", id).eq("org_id", ctx.org.id);
  revalidatePath("/clients");
  redirect("/clients");
}
