import { Inngest } from "inngest";

/**
 * Inngest client — the automation engine. The app emits lifecycle domain events
 * (see CLAUDE.md §5) and Inngest functions react to drive stage transitions,
 * emails, reminders, and scheduled jobs.
 */
export const inngest = new Inngest({ id: "client-onboarding-system" });

/** Domain events emitted across the client lifecycle. */
export type LifecycleEvents = {
  "contract/signed": { data: { orgId: string; clientId: string; contractId: string } };
  "payment/succeeded": { data: { orgId: string; clientId: string; invoiceId: string } };
  "form/submitted": { data: { orgId: string; clientId: string; formId: string } };
  "access/collected": { data: { orgId: string; clientId: string } };
  "kickoff/booked": { data: { orgId: string; clientId: string; startsAt: string } };
  "engagement/ending": { data: { orgId: string; clientId: string } };
};
