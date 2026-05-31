// Shared domain types + lifecycle definitions. Kept in sync with db/migrations.

export type Role = "owner" | "admin" | "member";

export type Stage =
  | "signed"
  | "contract"
  | "payment"
  | "welcome"
  | "onboarding_form"
  | "collect_access"
  | "kickoff"
  | "channel"
  | "project_setup"
  | "quick_win"
  | "weekly_updates"
  | "delivery"
  | "renewal";

/** The 13 lifecycle stages in order, with display labels. Drives the board + progress. */
export const STAGES: { key: Stage; label: string; short: string }[] = [
  { key: "signed", label: "Client Signs", short: "Signed" },
  { key: "contract", label: "Contract", short: "Contract" },
  { key: "payment", label: "Payment", short: "Payment" },
  { key: "welcome", label: "Welcome Email", short: "Welcome" },
  { key: "onboarding_form", label: "Onboarding Form", short: "Intake" },
  { key: "collect_access", label: "Collect Access", short: "Access" },
  { key: "kickoff", label: "Kickoff Call", short: "Kickoff" },
  { key: "channel", label: "Slack / WhatsApp", short: "Channel" },
  { key: "project_setup", label: "Project Setup", short: "Setup" },
  { key: "quick_win", label: "Quick Win", short: "Quick Win" },
  { key: "weekly_updates", label: "Weekly Updates", short: "Updates" },
  { key: "delivery", label: "Delivery", short: "Delivery" },
  { key: "renewal", label: "Renewal / Upsell", short: "Renewal" },
];

export const STAGE_LABEL: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label])
) as Record<Stage, string>;

export function stageIndex(stage: Stage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

export function stageProgress(stage: Stage): number {
  return Math.round(((stageIndex(stage) + 1) / STAGES.length) * 100);
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  brand_color: string | null;
  stripe_account_id: string | null;
  lead_form_enabled: boolean;
  lead_auto_proposal: boolean;
  lead_intro: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  value_cents: number;
  status: "active" | "paused" | "churned";
  stage: Stage;
  notes: string | null;
  portal_token: string;
  scope: string | null;
  deliverables: string | null;
  timeline_days: number | null;
  payment_structure: "full" | "split" | "retainer";
  source: "manual" | "lead_form";
  ai_brief: string | null;
  ai_brief_at: string | null;
  assigned_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  org_id: string;
  name: string;
  role: string | null;
  email: string | null;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  org_id: string;
  client_id: string;
  title: string | null;
  completed: string | null;
  in_progress: string | null;
  blockers: string | null;
  next_steps: string | null;
  created_at: string;
}

export interface ContractTemplate {
  id: string;
  org_id: string;
  name: string;
  body: string;
  created_at: string;
}

export interface Contract {
  id: string;
  org_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  body: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  provider: string;
  provider_request_id: string | null;
  signer_name: string | null;
  signed_pdf_url: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  contract_id: string | null;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "void";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  status: "active" | "completed" | "on_hold";
  slack_url: string | null;
  whatsapp_url: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  org_id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  type: "quick_win" | "delivery" | "general";
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  signed_off_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  assignee: "owner" | "client";
  status: "todo" | "done";
  due_date: string | null;
  created_at: string;
}

export type FormFieldType = "text" | "textarea" | "email" | "select" | "checkbox" | "url";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  schema: FormField[];
  is_intake: boolean;
  created_at: string;
}

export interface FormResponse {
  id: string;
  org_id: string;
  client_id: string;
  form_id: string;
  answers: Record<string, string | boolean>;
  submitted_at: string;
}

export interface ClientFile {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  path: string;
  size_bytes: number;
  content_type: string | null;
  kind: "asset" | "credential";
  created_at: string;
}

export interface Kickoff {
  id: string;
  org_id: string;
  client_id: string;
  scheduled_at: string | null;
  location: string | null;
  status: "pending" | "booked" | "completed" | "cancelled";
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  org_id: string;
  client_id: string | null;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);
}
