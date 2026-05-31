# Database migrations

SQL migrations are the **source of truth** for the schema. Every schema change is a
new timestamped `.sql` file here, applied to Supabase (via the SQL editor or
`supabase db push` once the CLI is set up).

Migrations land in **Step 2** of the roadmap (see [../../CLAUDE.md](../../CLAUDE.md)):
all core tables + Row Level Security policies enforcing `org_id` tenant isolation,
plus seed data.

Naming: `0001_init.sql`, `0002_<change>.sql`, …
