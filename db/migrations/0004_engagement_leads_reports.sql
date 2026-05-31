-- ============================================================================
-- Engagement structuring, public lead capture, and weekly reports.
-- ============================================================================

-- Structured engagement details on the client (scope/deliverables/timeline/payment).
alter table public.clients
  add column if not exists scope             text,
  add column if not exists deliverables      text,
  add column if not exists timeline_days     integer,
  add column if not exists payment_structure text not null default 'full'
       check (payment_structure in ('full','split','retainer')),
  add column if not exists source            text not null default 'manual'
       check (source in ('manual','lead_form'));

-- Public lead-capture settings per workspace.
alter table public.organizations
  add column if not exists lead_form_enabled  boolean not null default true,
  add column if not exists lead_auto_proposal boolean not null default false,
  add column if not exists lead_intro         text;

-- Structured weekly reports (client-visible in the portal).
create table if not exists public.weekly_reports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  title       text,
  completed   text,
  in_progress text,
  blockers    text,
  next_steps  text,
  created_at  timestamptz not null default now()
);
create index if not exists weekly_reports_client_idx on public.weekly_reports(client_id);

alter table public.weekly_reports enable row level security;
create policy "weekly_reports_tenant" on public.weekly_reports
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- Allow anonymous lead lookups of orgs by slug for the public apply page is NOT
-- needed — the /apply route uses the service-role client server-side.
