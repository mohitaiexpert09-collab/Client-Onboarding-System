import { inngest } from "./client";

/**
 * Inngest automation functions — the durable engine layer.
 *
 * Immediate lifecycle transitions (welcome email, stage advance, seeding tasks
 * and milestones) run inline in server actions via lib/automation.ts so the app
 * works with just Supabase. These Inngest functions add the durable/scheduled
 * capabilities that need a worker: time-based reminders and recurring weekly
 * updates. Run locally with `npx inngest-cli@latest dev`.
 */

// Observability hooks for the synchronous lifecycle events.
export const onContractSigned = inngest.createFunction(
  { id: "on-contract-signed", triggers: [{ event: "contract/signed" }] },
  async ({ event }) => {
    return { observed: "contract/signed", clientId: event.data.clientId };
  }
);

export const onPaymentSucceeded = inngest.createFunction(
  { id: "on-payment-succeeded", triggers: [{ event: "payment/succeeded" }] },
  async ({ event }) => {
    return { observed: "payment/succeeded", clientId: event.data.clientId };
  }
);

/**
 * Reminder: 2 days after the onboarding form is sent, nudge the client if they
 * still haven't submitted. (Durable sleep — needs the Inngest worker.)
 */
export const formReminder = inngest.createFunction(
  { id: "onboarding-form-reminder", triggers: [{ event: "form/submitted" }] },
  async ({ event, step }) => {
    await step.sleep("wait-2-days", "2d");
    // TODO(phase 2): check submission state via admin client and email a nudge.
    return { reminderCheckedFor: event.data.clientId };
  }
);

/**
 * Weekly client updates — recurring cron while engagements are active.
 * (Phase 2 fully implements per-client digest emails.)
 */
export const weeklyUpdates = inngest.createFunction(
  { id: "weekly-updates", triggers: [{ cron: "0 9 * * MON" }] },
  async () => {
    // TODO(phase 2): for each active client in delivery, email a weekly digest.
    return { ran: true };
  }
);

export const functions = [onContractSigned, onPaymentSucceeded, formReminder, weeklyUpdates];
