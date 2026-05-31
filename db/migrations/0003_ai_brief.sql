-- AI-generated client brief (from summarizing onboarding intake responses).
alter table public.clients
  add column if not exists ai_brief    text,
  add column if not exists ai_brief_at timestamptz;
