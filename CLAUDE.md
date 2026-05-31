# CLAUDE.md — AI Client Onboarding System

> Project guidance for Claude Code. This file is the source of truth for what we're
> building, the stack, conventions, and how to run things. Keep it updated as the
> system evolves.

---

## 1. What this is

A **multi-tenant SaaS** that solves client onboarding **end-to-end** for **agencies,
coaches, and consultants**. Each business signs up, gets an isolated workspace, and
runs its entire client lifecycle — from signing a client to renewal — with heavy
automation and a dashboard that tracks every client and every step.

**Core promise:** the owner does the selling; the system runs everything after the
"yes" — contract, payment, onboarding, delivery tracking, and renewal — automatically.

### Confirmed product decisions
- **Multi-tenant SaaS** — many orgs, fully isolated workspaces.
- **Integrate** proven services for the hard/legal parts (e-sign, payments, scheduling).
- **MVP first** (Sign → Kickoff fully automated), then layer on the full feature set.
- **Stack:** Next.js + TypeScript + Supabase + Tailwind/shadcn.

---

## 2. The client lifecycle (the product backbone)

The full journey the system automates from sign to renewal. Each step is a tracked
stage with its own status, automations, and dashboard visibility.

| # | Stage | What happens |
|---|-------|--------------|
| 1 | **Client Signs** | Deal won; client enters the lifecycle (manual add or public intake link). |
| 2 | **Contract** | Owner picks a template, fills details, sends for e-signature; client signs via secure link. |
| 3 | **Payment** | Signing auto-creates an invoice/deposit; client pays (Stripe). Payment gates the rest. |
| 4 | **Welcome Email** | On payment, an automated branded welcome email goes out with next steps + portal link. |
| 5 | **Onboarding Form** | Client completes the intake questionnaire (goals, brand info, business details). |
| 6 | **Collect Access** | Secure collection of credentials, logins, brand assets, file uploads. |
| 7 | **Kickoff Call** | Client books the kickoff via embedded scheduling; reminders auto-sent. |
| 8 | **Create Slack/WhatsApp** | Dedicated client communication channel provisioned. |
| 9 | **Project Setup** | Project/workspace created, onboarding checklist generated, team assigned. |
| 10 | **Quick Win** | Early-deliverable milestone tracked to build trust fast. |
| 11 | **Weekly Updates** | Automated recurring status updates/check-ins on a schedule. |
| 12 | **Delivery** | Milestones/deliverables tracked to completion; client sign-off captured. |
| 13 | **Renewal / Upsell** | Near end of engagement, auto-trigger renewal/upsell + new contract loop. |

The lifecycle is a **loop** — Renewal/Upsell feeds back into Contract. Owners see
everything on the **dashboard**; clients experience it through a **client portal**
(single secure link, no account needed for MVP).

---

## 3. Architecture & stack

| Concern | Choice |
|---------|--------|
| Framework | **Next.js 15** (App Router), TypeScript, Server Actions + Route Handlers |
| UI | **Tailwind CSS** + **shadcn/ui**, lucide icons, **Recharts** for dashboard charts |
| DB / Auth / Storage | **Supabase** (Postgres + RLS, Supabase Auth, Supabase Storage) |
| Multi-tenancy | Every tenant row carries `org_id`; **RLS policies** enforce isolation (core security boundary) |
| Payments | **Stripe Connect (Standard)** — each agency connects their own Stripe; optional platform fee |
| E-signature | **Dropbox Sign (HelloSign) API** — embedded signing, legal audit trail (DocuSign = alt) |
| Scheduling | **Cal.com** embed (or Calendly link) for kickoff |
| Client channels | **Slack API** (auto channel) + **WhatsApp** (Twilio / wa.me link) — Phase 2 auto |
| Email | **Resend** + **React Email** (welcome, weekly updates, reminders) |
| Automation / jobs | **Inngest** — durable, event-driven workflows |
| Hosting | **Vercel** (app) + **Supabase** (managed) + **Inngest** cloud |

**Why integrate:** removes legal/reliability risk on sensitive parts. **Why Supabase
RLS:** strong tenant isolation with little custom code. **Why Inngest:** real automation
engine without hand-rolling a queue.

---

## 4. Data model (core tables)

All tenant tables carry an `org_id` FK and an RLS policy: a row is visible only when its
`org_id` matches the requesting user's org.

**Tenant + people**
- `organizations` — the tenant (branding, Stripe Connect id).
- `profiles` — app users (owners/team), linked to Supabase auth.
- `memberships` — user ↔ org with `role` (owner / admin / member).

**CRM + pipeline**
- `clients` — name, email, company, status, current lifecycle stage.
- `pipeline_stages` — configurable stages per org.

**Contracts**
- `contract_templates` — body + merge fields.
- `contracts` — client_id, status (draft/sent/viewed/signed), esign provider id, signed_pdf_url.

**Payments**
- `invoices` — amount, status, Stripe ids, due date.
- `payments` — Stripe charge records (webhook-driven).

**Onboarding & delivery**
- `lifecycle_templates` + `lifecycle_steps` — reusable definitions of the 13-step flow.
- `lifecycle_instances` — a client's active journey (current stage, progress %).
- `projects` — engagement/workspace per client (status, channel links, assigned team).
- `milestones` — Quick Win, Delivery, etc. (status, sign-off, due date).
- `tasks` — checklist items (owner- or client-assigned).
- `channels` — provisioned Slack/WhatsApp links per client.
- `renewals` — renewal/upsell offers, dates, status.

**Forms & files**
- `forms` — questionnaire definition (JSON field schema) + `form_responses`.
- `files` — uploaded assets/credentials (Supabase Storage paths + metadata).

**Automation & audit**
- `automations` — trigger + conditions + actions (JSON).
- `automation_runs` — execution log.
- `activity_log` / `events` — append-only per-client timeline (drives dashboard + portal).
- `notifications` — in-app + email log.

---

## 5. Automation engine

Model: **event → workflow**. The app emits domain events to Inngest; functions react.

| Event | Reaction |
|-------|----------|
| `contract.signed` | Create invoice + send payment link → stage "Payment" |
| `payment.succeeded` | Send **Welcome Email** + create lifecycle/project instance + send **Onboarding Form** → "Onboarding" |
| `form.submitted` | Request **access/credentials** + notify owner |
| `access.collected` | Send **kickoff** scheduling link |
| `kickoff.booked` | Provision **Slack/WhatsApp channel** + **Project Setup** + create **Quick Win** milestone |
| (scheduled) | **Weekly Updates** emails while engagement is active |
| `engagement.ending` | Trigger **Renewal/Upsell** + new contract loop |
| (reminders) | "form incomplete 48h", "contract unsigned 3d", "kickoff not booked" nudges |

MVP ships a **fixed set** of these built-in automations. **Phase 2** adds a **visual
rule builder** (trigger/condition/action) writing to the `automations` table.

---

## 6. Dashboard (owner-facing, per org)

- **Overview:** active clients, in onboarding, pending signatures, outstanding invoices, revenue (Recharts).
- **Lifecycle Kanban:** drag clients across the 13 stages.
- **Client detail:** timeline (`activity_log`), contract status, payments, onboarding progress, files, forms.
- **Onboarding/delivery board:** every client's checklist/milestone progress at a glance.
- **Tasks:** what needs the owner's attention.
- Uses **Supabase Realtime** so statuses update live.

---

## 7. MVP scope vs Phase 2

**MVP (Sign → Kickoff fully automated; later stages tracked but lighter):**
1. Auth + org onboarding (Supabase Auth + memberships + RLS).
2. Client management + lifecycle Kanban.
3. Contracts → e-sign via Dropbox Sign → store signed PDF.
4. Payments — Stripe Connect + invoice/payment link on signing.
5. Welcome email (Resend) on payment.
6. Onboarding form + secure Collect Access (credentials/files).
7. Kickoff scheduling (Cal.com embed) + reminders.
8. Client portal — single secure link to sign, pay, fill form, upload, book kickoff.
9. Built-in Inngest automations driving stage transitions + reminders.
10. Lifecycle/delivery tracking (light): projects, checklist, milestones (Quick Win,
    Delivery), manual "create channel" link, manual-trigger weekly update template.
11. Dashboard — overview metrics, lifecycle Kanban, client detail timeline.

**Phase 2+:** auto Slack channel (Slack API) + WhatsApp (Twilio) · fully automated weekly
updates · automated renewal/upsell triggers · visual automation builder · recurring
billing/subscriptions · client login portal · template library/marketplace · white-label
branding & custom domains · analytics/reporting · Zapier/webhook integrations · AI assists
(auto-draft contracts, summarize intake, draft weekly updates, suggest upsells).

---

## 8. Implementation roadmap

- **Step 0** — this `CLAUDE.md`. ✅
- **Step 1** — Scaffold: Next.js + TS + Tailwind + shadcn; folders (`app/`, `components/`, `lib/`, `db/`); env/config; Supabase client.
- **Step 2** — DB + RLS: SQL migrations for all core tables; RLS policies; seed data.
- **Step 3** — Auth + multi-tenancy: signup/login, org creation, roles, tenant-scoped helpers.
- **Step 4** — Clients + lifecycle Kanban + dashboard shell.
- **Step 5** — Contracts + e-sign (Dropbox Sign embedded, webhook → status, store PDF).
- **Step 6** — Payments (Stripe Connect, invoices, payment links, webhooks).
- **Step 7** — Onboarding + forms + access + client portal.
- **Step 8** — Kickoff + delivery tracking (Cal.com, projects, milestones, weekly-update template).
- **Step 9** — Automation + email (Inngest functions across lifecycle, Resend templates).
- **Step 10** — Polish (charts, timeline, empty states, error handling).

---

## 9. Project structure (target)

```
app/
  (auth)/                 # signup, login
  (dashboard)/            # owner app: overview, clients, lifecycle, settings
  portal/[token]/         # client-facing secure portal (no login)
  api/
    inngest/route.ts      # Inngest endpoint
    webhooks/
      stripe/route.ts
      dropbox-sign/route.ts
components/
  ui/                     # shadcn components
  dashboard/
  portal/
lib/
  supabase/{server,client}.ts
  auth.ts                 # session + org helpers
  integrations/{stripe,dropbox-sign,resend,slack}.ts
inngest/                  # client + automation functions
db/
  migrations/*.sql        # schema + RLS
```

---

## 10. Environment variables

Create `.env.local` (and keep `.env.example` in sync — never commit real secrets):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (Connect)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Dropbox Sign
DROPBOX_SIGN_API_KEY=
DROPBOX_SIGN_CLIENT_ID=

# Resend
RESEND_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Conventions

- **TypeScript everywhere**; prefer Server Components + Server Actions; Route Handlers for webhooks.
- **Tenant safety first:** never query tenant data without an `org_id` scope; rely on RLS but also scope in code. Use the `service_role` key only in server-side/webhook contexts, never exposed to the client.
- **Secrets** only in server code and env; never in client bundles.
- **Domain events** flow through Inngest — don't hard-code multi-step side effects inside request handlers; emit an event and let a function handle it.
- **Idempotent webhooks** — Stripe/Dropbox Sign handlers must tolerate retries (dedupe on provider event id).
- **shadcn/ui** for components; keep styling in Tailwind utility classes.
- **Migrations** are the source of truth for schema — every schema change is a new SQL migration in `db/migrations/`.

---

## 12. How to run

The MVP is built. To run it for real you need a Supabase project (everything else is
optional and degrades gracefully).

```bash
npm install
npm run dev                 # Next.js dev server → http://localhost:3000
```

**Connect Supabase (required for auth + data):**
1. Create a project at supabase.com.
2. In the SQL editor run `db/migrations/0001_init.sql`, then `0002_storage.sql`.
3. Copy Project URL + anon key + service_role key into `.env.local`.
4. Restart `npm run dev`, open http://localhost:3000, and sign up.

**Optional services (work without them):**
```bash
npx inngest-cli@latest dev  # durable automations (weekly updates, reminders)
stripe listen --forward-to localhost:3000/api/webhooks/stripe  # real card payments
# Resend: set RESEND_API_KEY to actually send email (otherwise logged to console)
```

Without these: payments use a manual "mark paid" path, contracts use built-in
click-to-sign, and emails are logged to the server console.

```bash
npm run build && npx tsc --noEmit   # production build + typecheck
```

### What's built (MVP)
Multi-tenant auth + org workspaces (RLS) · clients + 13-stage lifecycle board ·
contracts (draft/send/built-in e-sign) · invoices (Stripe Checkout + manual fallback) ·
intake form builder + responses · secure client portal (sign, pay, fill form, upload,
book kickoff) · tasks, milestones (Quick Win/Delivery), channels · built-in lifecycle
automations + activity timeline · dashboard metrics · settings + integration status.

### Automated front door + client workspace (Phase 2 — built)
- **Public lead-capture form** at `/apply/[slug]` (`app/apply/[slug]/page.tsx`) — branded,
  no login; on submit creates a client (`source=lead_form`) and, if the workspace has
  auto-proposal on (+ OpenAI configured), AI-drafts + emails a proposal with the portal
  link. Managed from Settings → Lead capture (`updateLeadSettingsAction`).
- **Structured engagement** on the client: scope, deliverables, timeline_days,
  payment_structure (full/split/retainer) — edited on the client page.
- **Client-facing workspace** in the portal: progress, scope/deliverables/timeline,
  milestones, channel links, and weekly updates.
- **Structured weekly reports** (`weekly_reports` table): coach fills Completed / In
  progress / Blockers / Next steps → emailed to the client + shown in their portal.
- Schema: migration `0004_engagement_leads_reports.sql` (run it in Supabase).

### Analytics (Phase 2 — built)
`/analytics` (`app/(dashboard)/analytics/page.tsx`) computes aggregates server-side and
renders Recharts charts (`components/analytics/charts.tsx`): stat cards (revenue collected,
outstanding, avg deal value, sign→paid conversion, avg days to payment), monthly revenue
bar, new-clients area, and a lifecycle funnel (clients reaching each stage).

### AI assists (Phase 2 — built)
On the client page (`components/clients/ai-panel.tsx`): AI contract drafting from a
prompt, intake-response summarization into a brief + next steps (persisted to
`clients.ai_brief` — migration `0003_ai_brief.sql`), and weekly client update email
drafts. Powered by the OpenAI API via `lib/ai.ts` (model `gpt-4o-mini` by default,
override with `OPENAI_MODEL`; lazy server-only client). Set `OPENAI_API_KEY` in
`.env.local` to enable — the UI hides AI actions gracefully when it's absent. Run the
`0003_ai_brief.sql` migration in Supabase to add the brief column.

### Native documents (Phase 2 — built)
Proposals, contracts, and invoices are generated **natively in-app** — no third-party
document service. Branded, print-to-PDF document views live at
`app/portal/[token]/document/[id]/page.tsx` (proposal/agreement) and
`app/portal/[token]/invoice/[id]/page.tsx` (invoice), built on the shared
`components/documents/document-shell.tsx` + `print-button.tsx` (browser print-to-PDF,
zero server deps, toolbar hidden on print). Each doc pulls the org brand color, the
client engagement details (scope/deliverables/timeline/price/payment terms), and a
signature block; linked from both the client portal and the dashboard client page
("PDF"). e-signature stays as the built-in click-to-sign. (PandaDoc was evaluated and
dropped in favor of native generation — do not reintroduce a third-party doc provider.)

> Note: immediate lifecycle automations run inline (`lib/automation.ts`) so the app
> works with only Supabase; Inngest adds the durable/scheduled layer. The `proxy.ts`
> file is the Next.js 16 replacement for `middleware.ts`.

---

## 13. Verification

- **Per step:** `npm run dev`, exercise the new route; `npm run build` + typecheck clean; lint passes.
- **DB/RLS:** confirm a user in org A cannot read org B's rows (Supabase SQL tests).
- **Integrations:** Stripe test mode + CLI forwarding; Dropbox Sign test mode; Resend test sends; Inngest dev server.
- **End-to-end MVP demo:** create org → add client → send contract → sign via portal link →
  pay (test card) → welcome email + onboarding auto-start → fill intake form + upload access
  files → book kickoff → project/Quick Win milestone created → watch lifecycle Kanban +
  activity timeline update live and confirm reminder/welcome emails fire.

---

## 14. Open decisions (resolve during build)

- E-sign provider: **Dropbox Sign** (recommended) vs DocuSign.
- Payment timing: deposit-on-signing vs full vs subscriptions (MVP = single invoice/deposit).
- Scheduling: Cal.com vs Calendly.
- Client channel: Slack auto-create vs WhatsApp (Twilio) vs manual link (MVP = manual link).
