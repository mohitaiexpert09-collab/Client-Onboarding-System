import Link from "next/link";
import {
  UserPlus,
  KanbanSquare,
  BarChart3,
  Settings2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui";
import { STAGE_LABEL, formatMoney, type Stage } from "@/lib/types";

const ONBOARDING_STAGES = ["welcome", "onboarding_form", "collect_access", "kickoff", "channel", "project_setup"];

export default async function DashboardPage() {
  const ctx = await requireContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: invoices }, { data: contracts }, { data: activity }] =
    await Promise.all([
      supabase.from("clients").select("id,name,company,stage,status,value_cents,created_at").order("created_at", { ascending: false }),
      supabase.from("invoices").select("amount_cents,status"),
      supabase.from("contracts").select("status"),
      supabase
        .from("activity_log")
        .select("id,type,message,created_at,client_id")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const activeClients = (clients ?? []).filter((c) => c.status === "active").length;
  const inOnboarding = (clients ?? []).filter((c) => ONBOARDING_STAGES.includes(c.stage)).length;
  const pendingSignatures = (contracts ?? []).filter((c) => c.status === "sent" || c.status === "viewed").length;
  const revenue = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const outstanding = (invoices ?? []).filter((i) => i.status === "sent").reduce((s, i) => s + (i.amount_cents ?? 0), 0);

  const stats = [
    { label: "Active clients", value: String(activeClients), dot: "bg-brand-500", tint: "text-zinc-900 dark:text-zinc-50" },
    { label: "In onboarding", value: String(inOnboarding), dot: "bg-blue-500", tint: "text-zinc-900 dark:text-zinc-50" },
    { label: "Pending signatures", value: String(pendingSignatures), dot: "bg-amber-500", tint: "text-zinc-900 dark:text-zinc-50" },
    { label: "Revenue collected", value: formatMoney(revenue), dot: "bg-green-500", tint: "text-green-600 dark:text-green-400" },
    { label: "Outstanding", value: formatMoney(outstanding), dot: "bg-zinc-400", tint: "text-zinc-900 dark:text-zinc-50" },
  ];

  const quickActions: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Add a client", href: "/clients", icon: UserPlus },
    { label: "Lifecycle board", href: "/clients", icon: KanbanSquare },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Lead form & settings", href: "/settings", icon: Settings2 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back — ${ctx.org.name}`} />
      <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label} className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                <p className="truncate text-xs font-medium text-zinc-500 sm:text-[13px]">{s.label}</p>
              </div>
              <p className={`mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${s.tint}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white p-4 text-sm font-medium text-zinc-700 shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-brand-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 truncate">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Recent clients */}
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent clients</h2>
              <Link
                href="/clients"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {clients && clients.length > 0 ? (
              <ul className="-mx-2 divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {clients.slice(0, 7).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-semibold text-zinc-600 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-300">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/clients/${c.id}`} className="block truncate font-medium text-zinc-800 hover:text-brand-600 dark:text-zinc-200 dark:hover:text-brand-400">
                          {c.name}
                        </Link>
                        {c.company && <p className="truncate text-xs text-zinc-400">{c.company}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {c.value_cents > 0 && (
                        <span className="hidden text-sm font-medium tabular-nums text-zinc-500 sm:inline">{formatMoney(c.value_cents)}</span>
                      )}
                      <Badge color="brand">{STAGE_LABEL[c.stage as Stage]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-zinc-500">No clients yet.</p>
                <Link href="/clients" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
                  Add your first client →
                </Link>
              </div>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            {activity && activity.length > 0 ? (
              <ol className="relative space-y-4 before:absolute before:left-[3px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                {activity.map((a) => (
                  <li key={a.id} className="relative flex gap-3 pl-0 text-sm">
                    <span className="relative z-10 mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-brand-500 ring-4 ring-white dark:ring-zinc-900" />
                    <div className="min-w-0">
                      <p className="text-zinc-700 dark:text-zinc-300">{a.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No activity yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
