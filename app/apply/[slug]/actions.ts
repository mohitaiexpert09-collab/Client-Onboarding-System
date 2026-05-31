"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isAIConfigured, publicEnv } from "@/lib/env";
import { sendEmail, emailLayout } from "@/lib/email";
import { draftContract } from "@/lib/ai";
import type { Organization, Client } from "@/lib/types";

/**
 * Public lead submission (no auth — uses the service-role client).
 * Creates a client at the start of the lifecycle and, when the workspace has
 * auto-proposal enabled (and AI is configured), drafts + sends a proposal and
 * emails the prospect their portal link.
 */
export async function submitLeadAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!slug || !name) redirect(`/apply/${slug}?error=Please enter your name`);

  const admin = createAdminClient();
  const { data: orgData } = await admin.from("organizations").select("*").eq("slug", slug).maybeSingle();
  const org = orgData as Organization | null;
  if (!org || !org.lead_form_enabled) redirect(`/apply/${slug}?error=This form is not available`);

  const budget = Number(formData.get("budget") ?? 0);
  const scope = String(formData.get("scope") ?? "") || null;

  const { data: created } = await admin
    .from("clients")
    .insert({
      org_id: org.id,
      name,
      email: email || null,
      company: String(formData.get("company") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      value_cents: Math.round((isNaN(budget) ? 0 : budget) * 100),
      scope,
      source: "lead_form",
      notes: "Submitted via public lead form",
    })
    .select("*")
    .single();

  const client = created as Client | null;
  if (!client) redirect(`/apply/${slug}?error=Something went wrong`);

  await admin.from("activity_log").insert({
    org_id: org.id,
    client_id: client!.id,
    type: "lead.created",
    message: `New lead "${name}" via public form`,
  });

  let proposalSent = false;
  if (org.lead_auto_proposal && isAIConfigured() && scope) {
    try {
      const body = await draftContract({ orgName: org.name, clientName: name, prompt: scope });
      if (body) {
        await admin.from("contracts").insert({
          org_id: org.id,
          client_id: client!.id,
          title: "Proposal & Service Agreement",
          body,
          status: "sent",
        });
        await admin.from("clients").update({ stage: "contract" }).eq("id", client!.id);
        await admin.from("activity_log").insert({
          org_id: org.id,
          client_id: client!.id,
          type: "contract.sent",
          message: "Proposal auto-generated & sent",
        });
        if (email) {
          await sendEmail({
            to: email,
            subject: `Your proposal from ${org.name}`,
            html: emailLayout({
              heading: "Your proposal is ready",
              body: `Thanks for your interest, ${name}. Review and sign your proposal to get started.`,
              cta: { label: "Review & sign", url: `${publicEnv.appUrl}/portal/${client!.portal_token}` },
            }),
          });
        }
        proposalSent = true;
      }
    } catch {
      // Fall through — lead is captured; the owner can send a proposal manually.
    }
  }

  redirect(`/apply/${slug}?submitted=1${proposalSent ? "&proposal=1" : ""}`);
}
