import Link from "next/link";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { StageSelect } from "@/components/clients/stage-select";
import { STAGES, formatMoney, type Client } from "@/lib/types";

export default async function ClientsPage() {
  await requireContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  const clients = (data ?? []) as Client[];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Your lifecycle pipeline from signed to renewal"
        action={<NewClientDialog />}
      />

      {clients.length === 0 ? (
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500">No clients yet. Add your first client to start the lifecycle.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto p-4 sm:p-6 lg:p-8">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {STAGES.map((stage) => {
              const inStage = clients.filter((c) => c.stage === stage.key);
              return (
                <div key={stage.key} className="w-64 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{stage.short}</span>
                    <span className="rounded-full bg-zinc-100 px-2 text-xs text-zinc-500 dark:bg-zinc-800">
                      {inStage.length}
                    </span>
                  </div>
                  <div className="space-y-2 rounded-lg bg-zinc-100/60 p-2 dark:bg-zinc-900/40">
                    {inStage.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <Link
                          href={`/clients/${c.id}`}
                          className="block font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                        >
                          {c.name}
                        </Link>
                        {c.company && <p className="text-xs text-zinc-500">{c.company}</p>}
                        {c.value_cents > 0 && (
                          <p className="mt-1 text-xs font-medium text-green-600">{formatMoney(c.value_cents)}</p>
                        )}
                        <div className="mt-2">
                          <StageSelect clientId={c.id} stage={c.stage} />
                        </div>
                      </div>
                    ))}
                    {inStage.length === 0 && (
                      <p className="px-1 py-3 text-center text-xs text-zinc-400">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
