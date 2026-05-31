import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DocumentShell } from "@/components/documents/document-shell";
import { Markdown } from "@/components/documents/markdown";
import { formatMoney, type Client, type Organization, type Contract } from "@/lib/types";

const PAYMENT_LABELS: Record<Client["payment_structure"], string> = {
  full: "100% due on signing",
  split: "50% on signing, 50% on delivery",
  retainer: "Billed monthly as a retainer",
};

/** Client-facing, printable proposal / service agreement — premium styling. */
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { token, id } = await params;

  const admin = createAdminClient();
  const { data: clientData } = await admin.from("clients").select("*").eq("portal_token", token).maybeSingle();
  if (!clientData) notFound();
  const client = clientData as Client;

  const { data: contractData } = await admin
    .from("contracts")
    .select("*")
    .eq("id", id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!contractData) notFound();
  const contract = contractData as Contract;

  const { data: orgData } = await admin.from("organizations").select("*").eq("id", client.org_id).single();
  const org = orgData as Organization;
  const brand = org.brand_color || "#4f46e5";
  const isProposal = /proposal/i.test(contract.title);
  const created = new Date(contract.created_at);
  const validUntil = new Date(created.getTime() + 30 * 86400000);

  const stats = [
    client.value_cents > 0 && { label: "Investment", value: formatMoney(client.value_cents), sub: PAYMENT_LABELS[client.payment_structure] },
    client.timeline_days && { label: "Timeline", value: `${client.timeline_days} days`, sub: "Estimated delivery" },
    { label: "Prepared", value: created.toLocaleDateString(), sub: `Valid until ${validUntil.toLocaleDateString()}` },
  ].filter(Boolean) as { label: string; value: string; sub: string }[];

  return (
    <DocumentShell
      brandColor={brand}
      orgName={org.name}
      logoUrl={org.logo_url}
      docLabel={isProposal ? "Proposal" : "Service Agreement"}
      headerRight={<p className="mt-1 text-sm font-medium">{created.toLocaleDateString()}</p>}
    >
      {/* Prepared for / by */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Prepared for</p>
          <p className="text-lg font-semibold text-zinc-900">{client.name}</p>
          {client.company && <p className="text-sm text-zinc-600">{client.company}</p>}
          {client.email && <p className="text-sm text-zinc-500">{client.email}</p>}
        </div>
        <div className="sm:text-right">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Prepared by</p>
          <p className="text-lg font-semibold text-zinc-900">{org.name}</p>
          <p className="text-sm text-zinc-500">{isProposal ? "Proposal & Service Agreement" : "Service Agreement"}</p>
        </div>
      </div>

      <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900">{contract.title}</h1>
      <div className="mb-8 h-1 w-16 rounded-full" style={{ backgroundColor: brand }} />

      {/* Premium stat tiles */}
      {stats.length > 0 && (
        <div className="mb-9 grid gap-px overflow-hidden rounded-xl bg-zinc-100 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Scope / deliverables callouts (if no rich body, these carry the doc) */}
      {(client.scope || client.deliverables) && (
        <div className="mb-9 space-y-5">
          {client.scope && (
            <div className="rounded-xl border-l-4 bg-zinc-50 p-5" style={{ borderColor: brand }}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Scope of work</p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">{client.scope}</p>
            </div>
          )}
          {client.deliverables && (
            <div className="rounded-xl border-l-4 bg-zinc-50 p-5" style={{ borderColor: brand }}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Deliverables</p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">{client.deliverables}</p>
            </div>
          )}
        </div>
      )}

      {/* Body (markdown rendered) */}
      {contract.body && <Markdown content={contract.body} />}

      {/* Signature block */}
      <div className="mt-12 grid gap-10 border-t pt-8 sm:grid-cols-2">
        <div>
          <p className="mb-8 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Service provider</p>
          <div className="border-b-2 border-zinc-200 pb-1 text-lg font-semibold text-zinc-900">{org.name}</div>
          <p className="mt-1 text-xs text-zinc-500">Authorized signature</p>
        </div>
        <div>
          <p className="mb-8 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Client acceptance</p>
          <div className="border-b-2 pb-1 text-lg font-semibold text-zinc-900" style={{ borderColor: contract.signer_name ? brand : "#e4e4e7" }}>
            {contract.signer_name || " "}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {contract.signed_at ? `Signed ${new Date(contract.signed_at).toLocaleDateString()}` : "Signature & date"}
          </p>
        </div>
      </div>

      {contract.status === "signed" && (
        <div className="mt-8 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>✓</span>
          <span>
            Electronically signed by <strong>{contract.signer_name}</strong>
            {contract.signed_at ? ` on ${new Date(contract.signed_at).toLocaleString()}` : ""}.
          </span>
        </div>
      )}
    </DocumentShell>
  );
}
