import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Slack integration (Phase 2): auto-create a dedicated client channel and invite
 * the client + team during the "Create Slack/WhatsApp" lifecycle step.
 *
 * Stubbed for MVP — the lifecycle stores a manually-entered channel link until
 * this is wired to the Slack Web API (conversations.create + conversations.invite).
 */
export async function createClientChannel(clientName: string): Promise<{ url: string } | null> {
  const token = serverEnv.slackBotToken;
  if (!token) {
    // Not configured yet — fall back to manual link entry in the UI.
    return null;
  }
  throw new Error(`Slack channel creation for "${clientName}" not implemented yet (Phase 2).`);
}
