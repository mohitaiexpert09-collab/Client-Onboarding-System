"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createTemplateAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/contracts?error=Name is required");
  await supabase.from("contract_templates").insert({
    org_id: ctx.org.id,
    name,
    body: String(formData.get("body") ?? ""),
  });
  revalidatePath("/contracts");
}

export async function deleteTemplateAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  await supabase.from("contract_templates").delete().eq("id", String(formData.get("id"))).eq("org_id", ctx.org.id);
  revalidatePath("/contracts");
}
