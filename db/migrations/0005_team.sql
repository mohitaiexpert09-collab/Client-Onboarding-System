-- ============================================================================
-- Team members + per-client expert assignment.
-- ============================================================================

-- Experts/specialists a workspace can assign to clients (not necessarily app
-- users — these are roster entries the owner manages).
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  role       text,
  email      text,
  created_at timestamptz not null default now()
);
create index if not exists team_members_org_idx on public.team_members(org_id);

alter table public.team_members enable row level security;
create policy "team_members_tenant" on public.team_members
  for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- The expert assigned to a given client.
alter table public.clients
  add column if not exists assigned_member_id uuid references public.team_members(id) on delete set null;
