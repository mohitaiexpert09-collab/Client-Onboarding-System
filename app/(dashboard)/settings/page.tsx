import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { CopyLink } from "@/components/clients/copy-link";
import { isStripeConfigured, isResendConfigured, isAIConfigured, isSlackConfigured, publicEnv } from "@/lib/env";
import type { TeamMember } from "@/lib/types";
import {
  updateOrgAction,
  updateLeadSettingsAction,
  addTeamMemberAction,
  removeTeamMemberAction,
} from "./actions";

function statusBadge(ok: boolean) {
  return ok ? <Badge color="green">Connected</Badge> : <Badge color="zinc">Not configured</Badge>;
}

export default async function SettingsPage() {
  const ctx = await requireContext();
  const supabase = await createClient();
  const { data: teamData } = await supabase
    .from("team_members")
    .select("*")
    .eq("org_id", ctx.org.id)
    .order("created_at");
  const team = (teamData as TeamMember[] | null) ?? [];
  const esignConfigured = !!process.env.DROPBOX_SIGN_API_KEY;
  const n8nConfigured = !!process.env.N8N_WEBHOOK_URL;

  const integrations = [
    { name: "Stripe (payments)", ok: isStripeConfigured(), hint: "Add STRIPE_SECRET_KEY to .env.local" },
    { name: "Resend (email)", ok: isResendConfigured(), hint: "Add RESEND_API_KEY to .env.local" },
    { name: "n8n (email via webhook)", ok: n8nConfigured, hint: "Add N8N_WEBHOOK_URL to route emails through n8n → Gmail (sends to any address)" },
    { name: "Slack (client channels)", ok: isSlackConfigured(), hint: "Add SLACK_BOT_TOKEN (xoxb-…) to auto-create client channels" },
    { name: "Dropbox Sign (e-signature)", ok: esignConfigured, hint: "Optional — built-in click-to-sign works without it" },
    { name: "OpenAI (AI assists)", ok: isAIConfigured(), hint: "Add OPENAI_API_KEY for AI contract drafts, intake summaries & weekly updates" },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Workspace and integrations" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:p-8">
        <Card>
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Workspace</h2>
          <form action={updateOrgAction} className="space-y-3">
            <div>
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" name="name" defaultValue={ctx.org.name} />
            </div>
            <div>
              <Label htmlFor="brand_color">Brand color</Label>
              <Input id="brand_color" name="brand_color" type="color" defaultValue={ctx.org.brand_color ?? "#4f46e5"} className="h-10 w-20 p-1" />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Integrations</h2>
          <ul className="space-y-3">
            {integrations.map((i) => (
              <li key={i.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{i.name}</p>
                  {!i.ok && <p className="text-xs text-zinc-500">{i.hint}</p>}
                </div>
                {statusBadge(i.ok)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            All integrations are optional for testing — payments fall back to manual confirmation, emails log to
            the server console, and contracts use built-in click-to-sign until you add keys.
          </p>
        </Card>

        {/* Team */}
        <Card className="lg:col-span-2">
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">Team & experts</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Add the specialists you assign to clients. Assigned experts show on the client&apos;s project
            pipeline and in their portal.
          </p>
          {team.length > 0 && (
            <ul className="mb-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{m.name}</p>
                      <p className="text-xs text-zinc-500">{[m.role, m.email].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <form action={removeTeamMemberAction}>
                    <input type="hidden" name="member_id" value={m.id} />
                    <Button size="sm" variant="ghost" type="submit">Remove</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addTeamMemberAction} className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="tm-name">Name</Label>
              <Input id="tm-name" name="name" required placeholder="Jane Doe" />
            </div>
            <div className="flex-1">
              <Label htmlFor="tm-role">Role</Label>
              <Input id="tm-role" name="role" placeholder="Lead Designer" />
            </div>
            <div className="flex-1">
              <Label htmlFor="tm-email">Email (optional)</Label>
              <Input id="tm-email" name="email" type="email" placeholder="jane@agency.com" />
            </div>
            <Button size="sm" type="submit">Add</Button>
          </form>
        </Card>

        {/* Lead capture */}
        <Card className="lg:col-span-2">
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">Lead capture</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Share this public link in your ads, website, or link-in-bio. Submissions automatically create a client
            and start the lifecycle.
          </p>
          {ctx.org.slug && (
            <div className="mb-4">
              <Label>Your public lead form</Label>
              <CopyLink url={`${publicEnv.appUrl}/apply/${ctx.org.slug}`} />
            </div>
          )}
          <form action={updateLeadSettingsAction} className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="lead_form_enabled" defaultChecked={ctx.org.lead_form_enabled !== false} className="h-4 w-4" />
              Lead form enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" name="lead_auto_proposal" defaultChecked={!!ctx.org.lead_auto_proposal} className="h-4 w-4" />
              Auto-generate &amp; email a proposal when a lead submits (requires OpenAI)
            </label>
            <div>
              <Label htmlFor="lead_intro">Intro text (shown on the form)</Label>
              <Textarea id="lead_intro" name="lead_intro" rows={2} defaultValue={ctx.org.lead_intro ?? ""} placeholder="Tell prospects what to expect…" />
            </div>
            <Button type="submit">Save lead settings</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
