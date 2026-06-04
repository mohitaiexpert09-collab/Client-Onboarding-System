import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui";
import { RevenueChart, NewClientsChart, FunnelChart } from "@/components/analytics/charts";
import { STAGES, stageIndex, formatMoney, type Stage } from "@/lib/types";

/** Build the last `n` month buckets as { key: "YYYY-MM", label: "Mon" }. */
function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
      label: m.toLocaleString("en-US", { month: "short" }),
    });
  }
  return out;
}

const monthKey = (iso: string) => iso.slice(0, 7);

export default async function AnalyticsPage() {
  await requireContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: invoices }, { data: activity }] = await Promise.all([
    supabase.from("clients").select("id,stage,status,value_cents,created_at"),
    supabase.from("invoices").select("amount_cents,status,paid_at"),
    supabase.from("activity_log").select("type,created_at,client_id").eq("type", "payment.succeeded"),
  ]);

  const allClients = clients ?? [];
  const allInvoices = invoices ?? [];
  const payments = activity ?? [];

  // ---- Stat cards ----
  const totalRevenue = allInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const outstanding = allInvoices.filter((i) => i.status === "sent").reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const activeClients = allClients.filter((c) => c.status === "active");
  const avgDeal = activeClients.length
    ? Math.round(activeClients.reduce((s, c) => s + (c.value_cents ?? 0), 0) / activeClients.length)
    : 0;

  // Average days from client creation to first payment.
  const createdById = new Map(allClients.map((c) => [c.id, c.created_at]));
  const daysToPay: number[] = [];
  for (const p of payments) {
    const created = p.client_id ? createdById.get(p.client_id) : null;
    if (created) {
      const diff = (new Date(p.created_at).getTime() - new Date(created).getTime()) / 86_400_000;
      if (diff >= 0) daysToPay.push(diff);
    }
  }
  const avgDaysToPay = daysToPay.length
    ? Math.round(daysToPay.reduce((s, d) => s + d, 0) / daysToPay.length)
    : null;

  // ---- Monthly series (last 6 months) ----
  const months = lastMonths(6);
  const revenueByMonth = months.map((m) => ({
    month: m.label,
    revenue: Math.round(
      allInvoices
        .filter((i) => i.status === "paid" && i.paid_at && monthKey(i.paid_at) === m.key)
        .reduce((s, i) => s + (i.amount_cents ?? 0), 0) / 100
    ),
  }));
  const clientsByMonth = months.map((m) => ({
    month: m.label,
    count: allClients.filter((c) => monthKey(c.created_at) === m.key).length,
  }));

  // ---- Lifecycle funnel: clients that have reached at least each stage ----
  const funnel = STAGES.map((s) => ({
    stage: s.short,
    count: allClients.filter((c) => stageIndex(c.stage as Stage) >= stageIndex(s.key)).length,
  }));

  // Conversion: signed (all) → reached payment-or-beyond.
  const reachedPayment = allClients.filter((c) => stageIndex(c.stage as Stage) >= stageIndex("payment")).length;
  const conversion = allClients.length ? Math.round((reachedPayment / allClients.length) * 100) : 0;

  const stats = [
    { label: "Revenue collected", value: formatMoney(totalRevenue) },
    { label: "Outstanding", value: formatMoney(outstanding) },
    { label: "Avg deal value", value: formatMoney(avgDeal) },
    { label: "Sign → paid", value: `${conversion}%` },
    { label: "Avg days to payment", value: avgDaysToPay === null ? "—" : `${avgDaysToPay}d` },
  ];

  const hasData = allClients.length > 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, pipeline conversion, and onboarding velocity" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label}>
              <p className="text-sm text-zinc-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{s.value}</p>
            </Card>
          ))}
        </div>

        {!hasData ? (
          <Card>
            <p className="py-8 text-center text-sm text-zinc-500">
              No data yet — add clients and move them through the lifecycle to see analytics.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Revenue collected (last 6 months)</h2>
                <RevenueChart data={revenueByMonth} />
              </Card>
              <Card>
                <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">New clients (last 6 months)</h2>
                <NewClientsChart data={clientsByMonth} />
              </Card>
            </div>

            <Card>
              <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Lifecycle funnel</h2>
              <p className="mb-3 text-sm text-zinc-500">How many clients have reached at least each stage.</p>
              <FunnelChart data={funnel} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
