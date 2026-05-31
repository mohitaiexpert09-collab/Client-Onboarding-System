"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { emitEvent } from "@/lib/events";
import { createCheckoutSession } from "@/lib/payments";
import { runContractSigned, runPaymentSucceeded, runKickoffBooked } from "@/lib/automation";
import type { Client, Invoice } from "@/lib/types";

/** Resolve the client behind a portal token (service-role; bypasses RLS). */
async function resolveClient(token: string): Promise<Client | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("clients").select("*").eq("portal_token", token).maybeSingle();
  return (data as Client) ?? null;
}

export async function signContractAction(formData: FormData) {
  const token = String(formData.get("token"));
  const contractId = String(formData.get("contract_id"));
  const signerName = String(formData.get("signer_name") ?? "").trim();
  const client = await resolveClient(token);
  if (!client || !signerName) redirect(`/portal/${token}?error=Please type your full name to sign`);

  const admin = createAdminClient();
  await admin
    .from("contracts")
    .update({ status: "signed", signer_name: signerName, signed_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("org_id", client!.org_id);

  await logActivity({ orgId: client!.org_id, clientId: client!.id, type: "contract.signed", message: `Contract signed by ${signerName}` });
  await runContractSigned(client!.org_id, client!.id);
  await emitEvent("contract/signed", { orgId: client!.org_id, clientId: client!.id, contractId });

  revalidatePath(`/portal/${token}`);
  redirect(`/portal/${token}`);
}

export async function payInvoiceAction(formData: FormData) {
  const token = String(formData.get("token"));
  const invoiceId = String(formData.get("invoice_id"));
  const client = await resolveClient(token);
  if (!client) redirect(`/portal/${token}`);

  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("*").eq("id", invoiceId).single();
  const invoice = inv as Invoice;

  // Try Stripe Checkout; fall back to manual confirmation if not configured.
  const checkout = await createCheckoutSession({
    invoice,
    clientEmail: client!.email,
    portalToken: token,
  });

  if (checkout) {
    await admin.from("invoices").update({ stripe_checkout_session_id: checkout.sessionId }).eq("id", invoiceId);
    redirect(checkout.url);
  }

  // No Stripe → mark paid directly (demo path).
  await admin.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId);
  await logActivity({ orgId: client!.org_id, clientId: client!.id, type: "payment.succeeded", message: "Payment received" });
  await runPaymentSucceeded(client!.org_id, client!.id);
  await emitEvent("payment/succeeded", { orgId: client!.org_id, clientId: client!.id, invoiceId });
  revalidatePath(`/portal/${token}`);
  redirect(`/portal/${token}?paid=1`);
}

export async function submitIntakeAction(formData: FormData) {
  const token = String(formData.get("token"));
  const formId = String(formData.get("form_id"));
  const client = await resolveClient(token);
  if (!client) redirect(`/portal/${token}`);

  const answers: Record<string, string | boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (["token", "form_id"].includes(key)) continue;
    answers[key] = value === "on" ? true : String(value);
  }

  const admin = createAdminClient();
  await admin.from("form_responses").insert({
    org_id: client!.org_id,
    client_id: client!.id,
    form_id: formId,
    answers,
  });
  await admin.from("clients").update({ stage: "collect_access" }).eq("id", client!.id);
  await logActivity({ orgId: client!.org_id, clientId: client!.id, type: "form.submitted", message: "Onboarding form submitted" });
  await emitEvent("form/submitted", { orgId: client!.org_id, clientId: client!.id, formId });

  revalidatePath(`/portal/${token}`);
  redirect(`/portal/${token}?submitted=1`);
}

export async function uploadFileAction(formData: FormData) {
  const token = String(formData.get("token"));
  const kind = String(formData.get("kind") ?? "asset");
  const file = formData.get("file") as File | null;
  const client = await resolveClient(token);
  if (!client || !file || file.size === 0) redirect(`/portal/${token}`);

  const admin = createAdminClient();
  const path = `${client!.org_id}/${client!.id}/${Date.now()}-${file!.name}`;
  const { error } = await admin.storage
    .from("client-files")
    .upload(path, file!, { contentType: file!.type, upsert: false });

  if (!error) {
    await admin.from("files").insert({
      org_id: client!.org_id,
      client_id: client!.id,
      name: file!.name,
      path,
      size_bytes: file!.size,
      content_type: file!.type,
      kind,
    });
    await logActivity({ orgId: client!.org_id, clientId: client!.id, type: "file.uploaded", message: `Uploaded ${file!.name}` });
  }

  revalidatePath(`/portal/${token}`);
  redirect(`/portal/${token}?uploaded=1`);
}

export async function bookKickoffAction(formData: FormData) {
  const token = String(formData.get("token"));
  const when = String(formData.get("scheduled_at") ?? "");
  const client = await resolveClient(token);
  if (!client || !when) redirect(`/portal/${token}`);

  const admin = createAdminClient();
  await admin.from("kickoffs").insert({
    org_id: client!.org_id,
    client_id: client!.id,
    scheduled_at: new Date(when).toISOString(),
    status: "booked",
  });
  await admin.from("clients").update({ stage: "kickoff" }).eq("id", client!.id);
  await logActivity({ orgId: client!.org_id, clientId: client!.id, type: "kickoff.booked", message: "Client booked kickoff call" });
  await runKickoffBooked(client!.org_id, client!.id);
  await emitEvent("kickoff/booked", { orgId: client!.org_id, clientId: client!.id, startsAt: when });

  revalidatePath(`/portal/${token}`);
  redirect(`/portal/${token}?booked=1`);
}
