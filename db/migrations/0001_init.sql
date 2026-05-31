-- ============================================================================
-- Client Onboarding System — initial schema + Row Level Security
-- Apply in the Supabase SQL editor (or `supabase db push`).
-- Multi-tenancy: every tenant row carries org_id; RLS restricts access to
-- members of that org. Service-role (server/webhooks/portal) bypasses RLS.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Core tenant + identity
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique,
  logo_url          text,
  brand_color       text default '#4f46e5',
  stripe_account_id text,
  created_at        timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Clients + lifecycle
-- ----------------------------------------------------------------------------
-- The 13 lifecycle stages (see CLAUDE.md §2).
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  email        text,
  company      text,
  phone        text,
  value_cents  bigint default 0,
  status       text not null default 'active' check (status in ('active','paused','churned')),
  stage        text not null default 'signed' check (stage in (
                 'signed','contract','payment','welcome','onboarding_form',
                 'collect_access','kickoff','channel','project_setup','quick_win',
                 'weekly_updates','delivery','renewal')),
  notes        text,
  portal_token text not null default encode(gen_random_bytes(18), 'hex'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists clients_org_idx on public.clients(org_id);
create unique index if not exists clients_portal_token_idx on public.clients(portal_token);

-- ----------------------------------------------------------------------------
-- Contracts
-- ----------------------------------------------------------------------------
create table if not exists public.contract_templates (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  body       text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  client_id           uuid not null references public.clients(id) on delete cascade,
  template_id         uuid references public.contract_templates(id) on delete set null,
  title               text not null,
  body                text not null default '',
  status              text not null default 'draft' check (status in ('draft','sent','viewed','signed','declined')),
  provider            text not null default 'internal',
  provider_request_id text,
  signer_name         text,
  signed_pdf_url      text,
  signed_at           timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists contracts_client_idx on public.contracts(client_id);

-- ----------------------------------------------------------------------------
-- Payments
-- ----------------------------------------------------------------------------
create table if not exists public.invoices (
  id                         uuid primary key default gen_random_uuid(),
  org_id                     uuid not null references public.organizations(id) on delete cascade,
  client_id                  uuid not null references public.clients(id) on delete cascade,
  contract_id                uuid references public.contracts(id) on delete set null,
  description                text,
  amount_cents               bigint not null default 0,
  currency                   text not null default 'usd',
  status                     text not null default 'draft' check (status in ('draft','sent','paid','void')),
  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  due_date                   date,
  paid_at                    timestamptz,
  created_at                 timestamptz not null default now()
);
create index if not exists invoices_client_idx on public.invoices(client_id);

-- ----------------------------------------------------------------------------
-- Onboarding & delivery
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  name         text not null,
  status       text not null default 'active' check (status in ('active','completed','on_hold')),
  slack_url    text,
  whatsapp_url text,
  created_at   timestamptz not null default now()
);

create table if not exists public.milestones (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  title         text not null,
  type          text not null default 'general' check (type in ('quick_win','delivery','general')),
  status        text not null default 'todo' check (status in ('todo','in_progress','done')),
  due_date      date,
  signed_off_at timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  title       text not null,
  description text,
  assignee    text not null default 'owner' check (assignee in ('owner','client')),
  status      text not null default 'todo' check (status in ('todo','done')),
  due_date    date,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_client_idx on public.tasks(client_id);

-- ----------------------------------------------------------------------------
-- Forms & files
-- ----------------------------------------------------------------------------
create table if not exists public.forms (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  description text,
  schema      jsonb not null default '[]'::jsonb,   -- array of {key,label,type,required,options}
  is_intake   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.form_responses (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  form_id      uuid not null references public.forms(id) on delete cascade,
  answers      jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  name         text not null,
  path         text not null,
  size_bytes   bigint default 0,
  content_type text,
  kind         text not null default 'asset' check (kind in ('asset','credential')),
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Scheduling
-- ----------------------------------------------------------------------------
create table if not exists public.kickoffs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  scheduled_at timestamptz,
  location     text,
  status       text not null default 'pending' check (status in ('pending','booked','completed','cancelled')),
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Automation & audit
-- ----------------------------------------------------------------------------
create table if not exists public.automations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  trigger    text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions    jsonb not null default '[]'::jsonb,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  client_id  uuid references public.clients(id) on delete cascade,
  type       text not null,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_client_idx on public.activity_log(client_id);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER avoids recursive RLS when checking membership inside policies.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

-- Atomically create an org and make the caller its owner.
create or replace function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  insert into public.organizations (name, slug)
  values (org_name, lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6))
  returning id into new_org;

  insert into public.memberships (org_id, user_id, role)
  values (new_org, auth.uid(), 'owner');

  return new_org;
end;
$$;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep clients.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_touch on public.clients;
create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.organizations    enable row level security;
alter table public.profiles          enable row level security;
alter table public.memberships       enable row level security;
alter table public.clients           enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts         enable row level security;
alter table public.invoices          enable row level security;
alter table public.projects          enable row level security;
alter table public.milestones        enable row level security;
alter table public.tasks             enable row level security;
alter table public.forms             enable row level security;
alter table public.form_responses    enable row level security;
alter table public.files             enable row level security;
alter table public.kickoffs          enable row level security;
alter table public.automations       enable row level security;
alter table public.activity_log      enable row level security;
alter table public.notifications     enable row level security;

-- profiles: a user manages their own row.
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- organizations: members can read; any authenticated user can create (then
-- create_organization adds membership); members can update.
create policy "org read" on public.organizations
  for select using (public.is_org_member(id));
create policy "org insert" on public.organizations
  for insert with check (auth.uid() is not null);
create policy "org update" on public.organizations
  for update using (public.is_org_member(id));

-- memberships: a user sees their own membership rows.
create policy "membership read" on public.memberships
  for select using (user_id = auth.uid());
create policy "membership self insert" on public.memberships
  for insert with check (user_id = auth.uid());

-- Generic per-tenant policy applied to all org-scoped tables.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','contract_templates','contracts','invoices','projects','milestones',
    'tasks','forms','form_responses','files','kickoffs','automations','activity_log'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));',
      t || '_tenant', t
    );
  end loop;
end $$;

-- notifications: scoped to the recipient within their org.
create policy "notifications own" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
