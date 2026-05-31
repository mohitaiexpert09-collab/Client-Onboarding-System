import { NextResponse } from "next/server";
import { getStripe } from "@/lib/integrations/stripe";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import { runPaymentSucceeded } from "@/lib/automation";
import { emitEvent } from "@/lib/events";

/**
 * Stripe webhook (Connect). Verifies the signature, then translates Stripe events
 * into our lifecycle domain events. Must be idempotent — Stripe retries.
 *
 * Note: signature verification needs the raw body, so we read req.text().
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      serverEnv.stripeWebhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { invoice_id?: string; org_id?: string }; payment_intent?: string };
    const invoiceId = session.metadata?.invoice_id;
    const orgId = session.metadata?.org_id;

    if (invoiceId && orgId) {
      const admin = createAdminClient();
      // Idempotent: only act if not already paid.
      const { data: inv } = await admin.from("invoices").select("client_id,status").eq("id", invoiceId).maybeSingle();
      if (inv && inv.status !== "paid") {
        await admin
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .eq("id", invoiceId);
        await admin.from("activity_log").insert({ org_id: orgId, client_id: inv.client_id, type: "payment.succeeded", message: "Payment received (Stripe)" });
        await runPaymentSucceeded(orgId, inv.client_id);
        await emitEvent("payment/succeeded", { orgId, clientId: inv.client_id, invoiceId });
      }
    }
  }

  return NextResponse.json({ received: true });
}
