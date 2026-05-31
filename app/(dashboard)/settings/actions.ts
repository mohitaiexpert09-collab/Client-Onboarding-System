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
