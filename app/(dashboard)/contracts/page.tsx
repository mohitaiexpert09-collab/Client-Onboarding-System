import Link from "next/link";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge, Button, Input, Textarea, Label } from "@/components/ui";
import { createTemplateAction, deleteTemplateAction } from "./actions";
import type { ContractTemplate } from "@/lib/types";

type ContractRow = {
  id: string;
  title: string;
  status: string;
  client_id: string;
  created_at: string;
  clients: { name: string } | null;
};

export default async function ContractsPage() {
  await requireContext();
  const supabase = await createClient();

  const [{ data: contracts }, { data: templates }] = await Promise.all([
    supabase
      .from("contracts")
      .select("id,title,status,client_id,created_at,clients(name)")
      .order("created_at", { ascending: false }),
    supabase.from("contract_templates").select("*").order("created_at", { ascending: false }),
  ]);

  const rows = (contracts ?? []) as unknown as ContractRow[];
  const tpls = (templates ?? []) as ContractTemplate[];

  const statusColor = (s: string) =>
    s === "signed" ? "green" : s === "sent" || s === "viewed" ? "amber" : s === "declined" ? "red" : "zinc";

  return (
    <div>
      <PageHeader title="Contracts" subtitle="All agreements and reusable templates" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">All contracts</h2>
          {rows.length === 0 ? (
            <Card><p className="text-sm text-zinc-500">No contracts yet. Draft one from a client&apos;s page.</p></Card>
          ) : (
            <Card className="p-0">
              {/* Desktop: table */}
              <table className="hidden w-full text-sm sm:table">
                <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rows.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{c.title}</td>
                      <td className="px-4 py-3">
                        <Link href={`/clients/${c.client_id}`} className="text-brand-600 hover:underline dark:text-brand-400">
                          {c.clients?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                      <td className="px-4 py-3 text-zinc-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile: stacked cards */}
              <ul className="divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800">
                {rows.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{c.title}</p>
                      <Link href={`/clients/${c.client_id}`} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
                        {c.clients?.name ?? "—"}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-400">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge color={statusColor(c.status)}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Templates</h2>
          {tpls.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">{t.name}</p>
              <form action={deleteTemplateAction}>
                <input type="hidden" name="id" value={t.id} />
                <Button size="sm" variant="ghost" type="submit">Delete</Button>
              </form>
            </Card>
          ))}
          <Card>
            <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">New template</h3>
            <form action={createTemplateAction} className="space-y-2">
              <div>
                <Label htmlFor="tpl-name">Name</Label>
                <Input id="tpl-name" name="name" required placeholder="Standard Service Agreement" />
              </div>
              <div>
                <Label htmlFor="tpl-body">Body</Label>
                <Textarea id="tpl-body" name="body" rows={5} placeholder="Agreement terms…" />
              </div>
              <Button size="sm" type="submit">Save template</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
