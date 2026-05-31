"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormField } from "@/lib/types";

export async function createFormAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/forms?error=Name is required");

  let schema: FormField[] = [];
  try {
    schema = JSON.parse(String(formData.get("schema") ?? "[]"));
  } catch {
    schema = [];
  }
  const isIntake = String(formData.get("is_intake")) === "on";

  // Only one intake form per org — unset others if this is the intake form.
  if (isIntake) {
    await supabase.from("forms").update({ is_intake: false }).eq("org_id", ctx.org.id).eq("is_intake", true);
  }

  await supabase.from("forms").insert({
    org_id: ctx.org.id,
    name,
    description: String(formData.get("description") ?? "") || null,
    schema,
    is_intake: isIntake,
  });

  revalidatePath("/forms");
  redirect("/forms");
}

export async function deleteFormAction(formData: FormData) {
  const ctx = await requireContext();
  const supabase = await createClient();
  await supabase.from("forms").delete().eq("id", String(formData.get("id"))).eq("org_id", ctx.org.id);
  revalidatePath("/forms");
}
