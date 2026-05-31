import { inngest } from "@/inngest/client";

/**
 * Emit a lifecycle domain event to Inngest (best-effort). Wrapped so a missing
 * Inngest config in local dev never breaks a user action — automations are
 * additive to the synchronous flow.
 */
export async function emitEvent(name: string, data: Record<string, unknown>) {
  try {
    await inngest.send({ name, data });
  } catch (err) {
    console.warn(`[inngest] failed to emit ${name}:`, err instanceof Error ? err.message : err);
  }
}
