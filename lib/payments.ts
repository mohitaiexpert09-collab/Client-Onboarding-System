import "server-only";
import { isStripeConfigured, publicEnv } from "@/lib/env";
import type { Invoice } from "@/lib/types";

/**
 * Create a Stripe Checkout session for an invoice and return the hosted URL.
 * Returns null when Stripe isn't configured — the portal then offers a manual
 * "mark as paid" path so the flow is still demoable without keys.
 */
export async function createCheckoutSession(params: {
  invoice: Invoice;
  clientEmail: string | null;
  portalToken: string;
}): Promise<{ url: string; sessionId: string } | null> {
  if (!isStripeConfigured()) return null;

  const { getStripe } = await import("@/lib/integrations/stripe");
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.clientEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.invoice.currency || "usd",
          unit_amount: params.invoice.amount_cents,
          product_data: { name: params.invoice.description || "Invoice" },
        },
      },
    ],
    metadata: { invoice_id: params.invoice.id, org_id: params.invoice.org_id },
    success_url: `${publicEnv.appUrl}/portal/${params.portalToken}?paid=1`,
    cancel_url: `${publicEnv.appUrl}/portal/${params.portalToken}`,
  });

  return session.url ? { url: session.url, sessionId: session.id } : null;
}
