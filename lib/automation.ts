import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { createClientChannel, isSlackConfigured } from "@/lib/integrations/slack";
import { publicEnv } from "@/lib/env";
import type { Client } from "@/lib/types";

/**
 * Lifecycle automations, implemented against the service-role client so they run
 * identically from dashboard server actions and the public client portal — and
 * work with just Supabase configured (no separate Inngest worker required).
 * Inngest mirrors these as the durable/extensible engine (see inngest/functions.ts).
 *
 * Each routine is written to be idempotent (safe to run more than once).
 */

async function getClient(clientId: string): Promise<Client | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("clients").select("*").eq("id", clientId).maybeSingle();
  return (data as Client) ?? null;
}

async function log(orgId: string, clientId: string, type: string, message: string) {
  const admin = createAdminClient();
  await admin.from("activity_log").insert({ org_id: orgId, client_id: clientId, type, message });
}

/** contract.signed → ensure a deposit invoice exists + advance to Payment. */
export async function runContractSigned(orgId: string, clientId: string) {
  const admin = createAdminClient();
  const client = await getClient(clientId);
  if (!client) return;

  const { data: openInvoices } = await admin
    .from("invoices")
    .select("id")
    .eq("client_id", clientId)
    .neq("status", "paid");

  if ((openInvoices?.length ?? 0) === 0 && client.value_cents > 0) {
    await admin.from("invoices").insert({
      org_id: orgId,
      client_id: clientId,
      description: "Deposit",
      amount_cents: client.value_cents,
      status: "sent",
    });
    await log(orgId, clientId, "invoice.created", "Deposit invoice auto-created on signing");
  }
  await admin.from("clients").update({ stage: "payment" }).eq("id", clientId);
}

/** payment.succeeded → welcome email, advance to Welcome, seed onboarding tasks. */
export async function runPaymentSucceeded(orgId: string, clientId: string) {
  const admin = createAdminClient();
  const client = await getClient(clientId);
  if (!client) return;

  await admin.from("clients").update({ stage: "welcome" }).eq("id", clientId);

  if (client.email) {
    await sendEmail({
      to: client.email,
      subject: `Welcome aboard, ${client.name}! 🎉`,
      html: emailLayout({
        heading: `Welcome, ${client.name}!`,
        body:
          "Payment received — we're thrilled to get started. 🎁 A small welcome gift is on its way " +
          "to you. In the meantime, use your portal to complete onboarding so we can hit the ground running.",
        cta: { label: "Continue onboarding", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
      }),
    });
  }
  await log(orgId, clientId, "welcome.sent", "Welcome email sent (automation)");

  // Seed default onboarding checklist if none exists.
  const { data: existing } = await admin.from("tasks").select("id").eq("client_id", clientId).limit(1);
  if ((existing?.length ?? 0) === 0) {
    await admin.from("tasks").insert([
      { org_id: orgId, client_id: clientId, title: "Complete onboarding questionnaire", assignee: "client" },
      { org_id: orgId, client_id: clientId, title: "Share brand assets & access", assignee: "client" },
      { org_id: orgId, client_id: clientId, title: "Book kickoff call", assignee: "client" },
      { org_id: orgId, client_id: clientId, title: "🎁 Send welcome gift to client", assignee: "owner" },
      { org_id: orgId, client_id: clientId, title: "Assign expert / team to project", assignee: "owner" },
      { org_id: orgId, client_id: clientId, title: "Set up project workspace", assignee: "owner" },
      { org_id: orgId, client_id: clientId, title: "Define quick win", assignee: "owner" },
    ]);
  }
}

/** kickoff.booked → seed a Quick Win milestone + advance to Project Setup. */
export async function runKickoffBooked(orgId: string, clientId: string) {
  const admin = createAdminClient();
  const client = await getClient(clientId);
  if (!client) return;

  await admin.from("clients").update({ stage: "project_setup" }).eq("id", clientId);

  const { data: existing } = await admin
    .from("milestones")
    .select("id")
    .eq("client_id", clientId)
    .eq("type", "quick_win");
  if ((existing?.length ?? 0) === 0) {
    await admin.from("milestones").insert({
      org_id: orgId,
      client_id: clientId,
      title: "Deliver first quick win",
      type: "quick_win",
    });
    await log(orgId, clientId, "milestone.created", "Quick Win milestone created (automation)");
  }

  // Auto-provision a Slack channel on kickoff if configured and not already linked.
  if (isSlackConfigured()) {
    const { data: proj } = await admin
      .from("projects")
      .select("id,slack_url")
      .eq("client_id", clientId)
      .maybeSingle();
    if (!proj?.slack_url) {
      const result = await createClientChannel({ clientName: client.name, clientEmail: client.email });
      if (result) {
        if (proj) {
          await admin.from("projects").update({ slack_url: result.url }).eq("id", proj.id);
        } else {
          await admin.from("projects").insert({ org_id: orgId, client_id: clientId, name: "Engagement", slack_url: result.url });
        }
        await log(orgId, clientId, "channel.created", `Slack channel #${result.name} auto-created (kickoff)`);
      }
    }
  }
}
