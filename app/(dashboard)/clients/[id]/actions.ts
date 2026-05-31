"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { sendEmail, emailLayout } from "@/lib/email";
import { emitEvent } from "@/lib/events";
import { runPaymentSucceeded, runKickoffBooked } from "@/lib/automation";
import { createClientChannel } from "@/lib/integrations/slack";
import { publicEnv } from "@/lib/env";

async function clientGuard(clientId: string) {
  const ctx = await requireContext();
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("org_id", ctx.org.id)
    .single();
  return { ctx, supabase, client };
}

function revalidateClient(id: string) {
  revalidatePath(`/clients/${id}`);
}

// ---- Contracts -------------------------------------------------------------
export async function createContractAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);

  await supabase.from("contracts").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    title: String(formData.get("title") ?? "Service Agreement"),
    body: String(formData.get("body") ?? ""),
    status: "draft",
  });
  await logActivity({ orgId: ctx.org.id, clientId, type: "contract.created", message: "Contract drafted" });
  revalidateClient(clientId);
}

export async function sendContractAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const contractId = String(formData.get("contract_id"));
  const { ctx, supabase, client } = await clientGuard(clientId);

  await supabase.from("contracts").update({ status: "sent" }).eq("id", contractId).eq("org_id", ctx.org.id);
  await supabase.from("clients").update({ stage: "contract" }).eq("id", clientId).eq("org_id", ctx.org.id);

  if (client?.email) {
    await sendEmail({
      to: client.email,
      subject: "Please review and sign your agreement",
      html: emailLayout({
        heading: "Your agreement is ready",
        body: "Please review and sign your agreement to get started.",
        cta: { label: "Review & sign", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
      }),
    });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "contract.sent", message: "Contract sent for signature" });
  revalidateClient(clientId);
}

// ---- Invoices --------------------------------------------------------------
export async function createInvoiceAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase, client } = await clientGuard(clientId);
  const dollars = Number(formData.get("amount") ?? 0);

  await supabase.from("invoices").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    description: String(formData.get("description") ?? "Deposit"),
    amount_cents: Math.round((isNaN(dollars) ? 0 : dollars) * 100),
    status: "sent",
  });
  await supabase.from("clients").update({ stage: "payment" }).eq("id", clientId).eq("org_id", ctx.org.id);

  if (client?.email) {
    await sendEmail({
      to: client.email,
      subject: "Your invoice is ready",
      html: emailLayout({
        heading: "Invoice ready",
        body: "Please complete your payment to begin onboarding.",
        cta: { label: "Pay invoice", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
      }),
    });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "invoice.created", message: "Invoice sent" });
  revalidateClient(clientId);
}

export async function markInvoicePaidAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const invoiceId = String(formData.get("invoice_id"));
  const { ctx, supabase } = await clientGuard(clientId);

  await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("org_id", ctx.org.id);

  await logActivity({ orgId: ctx.org.id, clientId, type: "payment.succeeded", message: "Payment received" });
  await runPaymentSucceeded(ctx.org.id, clientId);
  await emitEvent("payment/succeeded", { orgId: ctx.org.id, clientId, invoiceId });
  revalidateClient(clientId);
}

// ---- Tasks -----------------------------------------------------------------
export async function addTaskAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);
  await supabase.from("tasks").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    title: String(formData.get("title") ?? ""),
    assignee: String(formData.get("assignee") ?? "owner"),
  });
  revalidateClient(clientId);
}

export async function toggleTaskAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const taskId = String(formData.get("task_id"));
  const done = String(formData.get("done")) === "true";
  const { ctx, supabase } = await clientGuard(clientId);
  await supabase
    .from("tasks")
    .update({ status: done ? "done" : "todo" })
    .eq("id", taskId)
    .eq("org_id", ctx.org.id);
  revalidateClient(clientId);
}

// ---- Milestones ------------------------------------------------------------
export async function addMilestoneAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);
  await supabase.from("milestones").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "general"),
  });
  revalidateClient(clientId);
}

export async function updateMilestoneAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const milestoneId = String(formData.get("milestone_id"));
  const status = String(formData.get("status") ?? "todo");
  const { ctx, supabase } = await clientGuard(clientId);
  await supabase
    .from("milestones")
    .update({
      status,
      signed_off_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)
    .eq("org_id", ctx.org.id);
  revalidateClient(clientId);
}

// ---- Channels & kickoff ----------------------------------------------------
export async function setChannelsAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);

  const slack = String(formData.get("slack_url") ?? "") || null;
  const whatsapp = String(formData.get("whatsapp_url") ?? "") || null;

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .eq("org_id", ctx.org.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("projects").update({ slack_url: slack, whatsapp_url: whatsapp }).eq("id", existing.id);
  } else {
    await supabase.from("projects").insert({
      org_id: ctx.org.id,
      client_id: clientId,
      name: "Engagement",
      slack_url: slack,
      whatsapp_url: whatsapp,
    });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "channel.set", message: "Client channel linked" });
  revalidateClient(clientId);
}

/** Auto-create a real Slack channel for the client and store its link. */
export async function createSlackChannelAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase, client } = await clientGuard(clientId);
  if (!client) return;

  const result = await createClientChannel({
    clientName: client.name,
    clientEmail: client.email,
    orgName: ctx.org.name,
  });
  if (!result) {
    await logActivity({ orgId: ctx.org.id, clientId, type: "channel.error", message: "Slack channel creation unavailable — add a bot token or use the manual link" });
    revalidateClient(clientId);
    return;
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId)
    .eq("org_id", ctx.org.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("projects").update({ slack_url: result.url }).eq("id", existing.id);
  } else {
    await supabase.from("projects").insert({ org_id: ctx.org.id, client_id: clientId, name: "Engagement", slack_url: result.url });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "channel.created", message: `Slack channel #${result.name} created` });
  revalidateClient(clientId);
}

export async function scheduleKickoffAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);
  const when = String(formData.get("scheduled_at") ?? "");

  await supabase.from("kickoffs").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    scheduled_at: when ? new Date(when).toISOString() : null,
    location: String(formData.get("location") ?? "") || null,
    status: "booked",
  });
  await logActivity({ orgId: ctx.org.id, clientId, type: "kickoff.booked", message: "Kickoff scheduled" });
  await runKickoffBooked(ctx.org.id, clientId);
  await emitEvent("kickoff/booked", { orgId: ctx.org.id, clientId, startsAt: when });
  revalidateClient(clientId);
}

// ---- Team assignment -------------------------------------------------------
export async function assignMemberAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);
  const memberId = String(formData.get("assigned_member_id") ?? "") || null;
  await supabase
    .from("clients")
    .update({ assigned_member_id: memberId })
    .eq("id", clientId)
    .eq("org_id", ctx.org.id);
  await logActivity({ orgId: ctx.org.id, clientId, type: "member.assigned", message: "Expert assigned to client" });
  revalidateClient(clientId);
}

// ---- Intake form -----------------------------------------------------------
export async function sendIntakeFormAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase, client } = await clientGuard(clientId);

  await supabase
    .from("clients")
    .update({ stage: "onboarding_form" })
    .eq("id", clientId)
    .eq("org_id", ctx.org.id);

  let sent = false;
  if (client?.email) {
    sent = await sendEmail({
      to: client.email,
      subject: "Quick onboarding questionnaire",
      html: emailLayout({
        heading: "Let's get started",
        body: "Please complete a short onboarding questionnaire so we can hit the ground running.",
        cta: { label: "Complete questionnaire", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
        brandColor: ctx.org.brand_color ?? undefined,
        orgName: ctx.org.name,
      }),
    });
  }
  await logActivity({
    orgId: ctx.org.id,
    clientId,
    type: "form.sent",
    message: !client?.email
      ? "Onboarding form ready — no client email on file"
      : sent
        ? "Onboarding form sent"
        : `Onboarding email could NOT be delivered to ${client.email} — connect/verify Resend (free tier only sends to your own Resend account email)`,
  });
  revalidateClient(clientId);
}

// ---- Engagement details ----------------------------------------------------
export async function updateEngagementAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase } = await clientGuard(clientId);
  const days = Number(formData.get("timeline_days") ?? 0);
  await supabase
    .from("clients")
    .update({
      scope: String(formData.get("scope") ?? "") || null,
      deliverables: String(formData.get("deliverables") ?? "") || null,
      timeline_days: isNaN(days) || days <= 0 ? null : Math.round(days),
      payment_structure: String(formData.get("payment_structure") ?? "full"),
    })
    .eq("id", clientId)
    .eq("org_id", ctx.org.id);
  revalidateClient(clientId);
}

// ---- Weekly reports --------------------------------------------------------
export async function addWeeklyReportAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, supabase, client } = await clientGuard(clientId);

  await supabase.from("weekly_reports").insert({
    org_id: ctx.org.id,
    client_id: clientId,
    title: String(formData.get("title") ?? "") || null,
    completed: String(formData.get("completed") ?? "") || null,
    in_progress: String(formData.get("in_progress") ?? "") || null,
    blockers: String(formData.get("blockers") ?? "") || null,
    next_steps: String(formData.get("next_steps") ?? "") || null,
  });

  if (client?.email) {
    const section = (label: string, v: FormDataEntryValue | null) =>
      v ? `<p><strong>${label}</strong><br/>${String(v).replace(/\n/g, "<br/>")}</p>` : "";
    await sendEmail({
      to: client.email,
      subject: `Weekly update — ${client.name}`,
      html: emailLayout({
        heading: String(formData.get("title") ?? "Your weekly update"),
        body:
          section("✅ Completed", formData.get("completed")) +
          section("🔄 In progress", formData.get("in_progress")) +
          section("⛔ Blockers / needed from you", formData.get("blockers")) +
          section("➡️ Next steps", formData.get("next_steps")),
        cta: { label: "View in your portal", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
      }),
    });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "report.sent", message: "Weekly report sent" });
  revalidateClient(clientId);
}

// ---- Welcome email ---------------------------------------------------------
export async function sendWelcomeEmailAction(formData: FormData) {
  const clientId = String(formData.get("client_id"));
  const { ctx, client } = await clientGuard(clientId);
  if (client?.email) {
    await sendEmail({
      to: client.email,
      subject: `Welcome aboard, ${client.name}!`,
      html: emailLayout({
        heading: `Welcome, ${client.name}!`,
        body: "We're thrilled to work with you. Use your portal to track everything in one place.",
        cta: { label: "Open your portal", url: `${publicEnv.appUrl}/portal/${client.portal_token}` },
      }),
    });
  }
  await logActivity({ orgId: ctx.org.id, clientId, type: "welcome.sent", message: "Welcome email sent" });
  revalidateClient(clientId);
}
