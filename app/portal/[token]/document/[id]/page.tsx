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

/** Client-facing, printable proposal / service agreement. */
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

  return (
    <DocumentShell brandColor={brand} orgName={org.name} docLabel={isProposal ? "Proposal" : "Agreement"}>
      <div className="mb-8 flex items-start justify-between text-sm">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-400">Prepared for</p>
          <p className="font-semibold text-zinc-900">{client.name}</p>
          {client.company && <p className="text-zinc-600">{client.company}</p>}
          {client.email && <p className="text-zinc-500">{client.email}</p>}
        </div>
        <div className="text-right">
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-400">Date</p>
          <p className="text-zinc-700">{new Date(contract.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <h1 className="mb-6 text-3xl font-bold text-zinc-900">{contract.title}</h1>

      {/* Engagement summary */}
      {(client.scope || client.deliverables || client.timeline_days || client.value_cents > 0) && (
        <div className="mb-8 grid gap-4 rounded-lg bg-zinc-50 p-5 sm:grid-cols-2">
          {client.value_cents > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Investment</p>
              <p className="text-lg font-semibold text-zinc-900">{formatMoney(client.value_cents)}</p>
              <p className="text-xs text-zinc-500">{PAYMENT_LABELS[client.payment_structure]}</p>
            </div>
          )}
          {client.timeline_days && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Timeline</p>
              <p className="text-lg font-semibold text-zinc-900">{client.timeline_days} days</p>
            </div>
          )}
          {client.scope && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Scope</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{client.scope}</p>
            </div>
          )}
          {client.deliverables && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Deliverables</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{client.deliverables}</p>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {contract.body && <Markdown content={contract.body} />}

      {/* Signature block */}
      <div className="mt-12 grid gap-8 border-t pt-8 sm:grid-cols-2">
        <div>
          <p className="mb-6 text-xs uppercase tracking-wider text-zinc-400">Service provider</p>
          <div className="border-b border-zinc-300 pb-1 font-semibold text-zinc-900">{org.name}</div>
          <p className="mt-1 text-xs text-zinc-500">Authorized signature</p>
        </div>
        <div>
          <p className="mb-6 text-xs uppercase tracking-wider text-zinc-400">Client</p>
          <div className="border-b border-zinc-300 pb-1 font-semibold text-zinc-900">
            {contract.signer_name || " "}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {contract.signed_at
              ? `Signed ${new Date(contract.signed_at).toLocaleDateString()}`
              : "Signature"}
          </p>
        </div>
      </div>

      {contract.status === "signed" && (
        <p className="mt-6 text-center text-xs text-zinc-400">
          This document was electronically signed by {contract.signer_name} on{" "}
          {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : ""}.
        </p>
      )}
    </DocumentShell>
  );
}
