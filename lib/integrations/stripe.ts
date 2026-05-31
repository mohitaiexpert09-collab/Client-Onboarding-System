import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

/**
 * Lazily-initialized Stripe client (server-only).
 * We use Stripe Connect so each org collects payments through their own
 * connected account — pass `{ stripeAccount }` on requests that act on behalf
 * of a connected account.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(serverEnv.stripeSecretKey, {
      appInfo: { name: "Client Onboarding System" },
    });
  }
  return _stripe;
}
