"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateOrgAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({
      name: String(formData.get("name") ?? ctx.org.name),
      brand_color: String(formData.get("brand_color") ?? "#4f46e5"),
    })
    .eq("id", ctx.org.id);
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function addTeamMemberAction(formData: FormData) {
  const ctx = await requireContext();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("team_members").insert({
    org_id: ctx.org.id,
    name,
    role: String(formData.get("role") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
  });
  revalidatePath("/settings");
}

export async function removeTeamMemberAction(formData: FormData) {
  const ctx = await requireContext();
  const id = String(formData.get("member_id"));
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", id).eq("org_id", ctx.org.id);
  revalidatePath("/settings");
}

export async function updateLeadSettingsAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({
      lead_form_enabled: String(formData.get("lead_form_enabled")) === "on",
      lead_auto_proposal: String(formData.get("lead_auto_proposal")) === "on",
      lead_intro: String(formData.get("lead_intro") ?? "") || null,
    })
    .eq("id", ctx.org.id);
  revalidatePath("/settings");
}
