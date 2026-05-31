import Link from "next/link";
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
    { label: "Active clients", value: String(activeClients), accent: "bg-indigo-500", tint: "text-indigo-600 dark:text-indigo-400" },
    { label: "In onboarding", value: String(inOnboarding), accent: "bg-blue-500", tint: "text-blue-600 dark:text-blue-400" },
    { label: "Pending signatures", value: String(pendingSignatures), accent: "bg-amber-500", tint: "text-amber-600 dark:text-amber-400" },
    { label: "Revenue collected", value: formatMoney(revenue), accent: "bg-green-500", tint: "text-green-600 dark:text-green-400" },
    { label: "Outstanding", value: formatMoney(outstanding), accent: "bg-zinc-400", tint: "text-zinc-600 dark:text-zinc-400" },
  ];

  const quickActions = [
    { label: "Add a client", href: "/clients", icon: "＋" },
    { label: "Lifecycle board", href: "/clients", icon: "▦" },
    { label: "Analytics", href: "/analytics", icon: "📊" },
    { label: "Lead form & settings", href: "/settings", icon: "⚙" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back — ${ctx.org.name}`} />
      <div className="space-y-8 p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label} className="relative overflow-hidden p-0">
              <div className={`absolute inset-x-0 top-0 h-1 ${s.accent}`} />
              <div className="p-5">
                <p className="text-sm text-zinc-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${s.tint}`}>{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-700"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {a.icon}
              </span>
              {a.label}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent clients */}
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent clients</h2>
              <Link href="/clients" className="text-sm text-indigo-600 hover:underline">View all</Link>
            </div>
            {clients && clients.length > 0 ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {clients.slice(0, 7).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/clients/${c.id}`} className="block truncate font-medium text-zinc-800 hover:underline dark:text-zinc-200">
                          {c.name}
                        </Link>
                        {c.company && <p className="truncate text-xs text-zinc-400">{c.company}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {c.value_cents > 0 && (
                        <span className="hidden text-sm font-medium text-zinc-500 sm:inline">{formatMoney(c.value_cents)}</span>
                      )}
                      <Badge color="indigo">{STAGE_LABEL[c.stage as Stage]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-zinc-500">No clients yet.</p>
                <Link href="/clients" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
                  Add your first client →
                </Link>
              </div>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            {activity && activity.length > 0 ? (
              <ul className="space-y-4">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                    <div className="min-w-0">
                      <p className="text-zinc-700 dark:text-zinc-300">{a.message}</p>
                      <p className="text-xs text-zinc-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No activity yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
