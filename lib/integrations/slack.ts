import "server-only";
import { isSlackConfigured } from "@/lib/env";

export { isSlackConfigured };

/**
 * Slack integration (Web API). When SLACK_BOT_TOKEN is set, we create a
 * dedicated channel per client, post a welcome message, best-effort invite the
 * client (Slack Connect) + configured team members, and return a deep link to
 * the channel. Without a token everything degrades to the manual link field.
 *
 * Required bot scopes: channels:manage, chat:write, channels:read.
 * Optional (to invite the external client): Slack Connect enabled + the
 * conversations.connect scopes. Team auto-invite uses SLACK_TEAM_USER_IDS
 * (comma-separated Slack user IDs).
 */

const SLACK_API = "https://slack.com/api";

async function slackCall<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>,
): Promise<({ ok: boolean; error?: string } & T) | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${SLACK_API}/${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as { ok: boolean; error?: string } & T;
  } catch {
    return null;
  }
}

/** Slack channel names: lowercase, ≤80 chars, only a-z0-9 and hyphens. */
function slugifyChannel(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "client";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `client-${base}-${suffix}`;
}

export interface SlackChannelResult {
  id: string;
  name: string;
  url: string;
}

/**
 * Create a client channel, post a welcome message, and (best-effort) invite the
 * client + team. Returns the channel info, or null if Slack isn't configured or
 * creation fails (caller falls back to manual entry).
 */
export async function createClientChannel(params: {
  clientName: string;
  clientEmail?: string | null;
  orgName?: string;
}): Promise<SlackChannelResult | null> {
  if (!isSlackConfigured()) return null;

  // Create the channel (retry once on name clash).
  let created = await slackCall<{ channel: { id: string; name: string } }>("conversations.create", {
    name: slugifyChannel(params.clientName),
    is_private: false,
  });
  if (created && !created.ok && created.error === "name_taken") {
    created = await slackCall<{ channel: { id: string; name: string } }>("conversations.create", {
      name: slugifyChannel(params.clientName),
      is_private: false,
    });
  }
  if (!created?.ok || !created.channel) return null;

  const channelId = created.channel.id;

  // Welcome message.
  await slackCall("chat.postMessage", {
    channel: channelId,
    text:
      `:wave: Welcome${params.clientName ? ` ${params.clientName}` : ""}! This is your dedicated channel` +
      `${params.orgName ? ` with ${params.orgName}` : ""}. Drop any questions here — we're glad to have you on board. :tada:`,
  });

  // Best-effort: invite configured team members (Slack user IDs).
  const teamIds = (process.env.SLACK_TEAM_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (teamIds.length) {
    await slackCall("conversations.invite", { channel: channelId, users: teamIds.join(",") });
  }

  // Best-effort: invite the external client via Slack Connect (needs the
  // workspace to support it; ignored on failure).
  if (params.clientEmail) {
    await slackCall("conversations.inviteShared", { channel: channelId, emails: params.clientEmail });
  }

  // Build a deep link to the channel from the workspace URL.
  const auth = await slackCall<{ url: string }>("auth.test", {});
  const workspaceUrl = auth?.ok && auth.url ? auth.url.replace(/\/$/, "") : "https://app.slack.com";
  const url = `${workspaceUrl}/archives/${channelId}`;

  return { id: channelId, name: created.channel.name, url };
}
