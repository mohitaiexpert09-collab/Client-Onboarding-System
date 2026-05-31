import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DocumentShell } from "@/components/documents/document-shell";
import { formatMoney, type Client, type Organization, type Invoice } from "@/lib/types";

/** Client-facing, printable invoice. */
export default async function InvoicePage({
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

  const { data: invoiceData } = await admin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!invoiceData) notFound();
  const invoice = invoiceData as Invoice;

  const { data: orgData } = await admin.from("organizations").select("*").eq("id", client.org_id).single();
  const org = orgData as Organization;
  const brand = org.brand_color || "#4f46e5";
  const number = invoice.id.slice(0, 8).toUpperCase();

  return (
    <DocumentShell brandColor={brand} orgName={org.name} docLabel="Invoice">
      <div className="mb-8 flex items-start justify-between">
        <div className="text-sm">
          <p className="mb-1 text-xs uppercase tracking-wider text-zinc-400">Billed to</p>
          <p className="font-semibold text-zinc-900">{client.name}</p>
          {client.company && <p className="text-zinc-600">{client.company}</p>}
          {client.email && <p className="text-zinc-500">{client.email}</p>}
        </div>
        <div className="text-right text-sm">
          <p className="text-2xl font-bold text-zinc-900">Invoice</p>
          <p className="text-zinc-500">#{number}</p>
          <p className="mt-2 text-xs text-zinc-400">Issued {new Date(invoice.created_at).toLocaleDateString()}</p>
          {invoice.due_date && (
            <p className="text-xs text-zinc-400">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-zinc-400">
            <th className="pb-2">Description</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-4 text-zinc-800">{invoice.description || "Professional services"}</td>
            <td className="py-4 text-right text-zinc-800">{formatMoney(invoice.amount_cents, invoice.currency)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 text-right font-semibold text-zinc-900">Total due</td>
            <td className="pt-4 text-right text-lg font-bold" style={{ color: brand }}>
              {formatMoney(invoice.amount_cents, invoice.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-5 py-4">
        <span className="text-sm text-zinc-500">Status</span>
        {invoice.status === "paid" ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            PAID{invoice.paid_at ? ` · ${new Date(invoice.paid_at).toLocaleDateString()}` : ""}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">DUE</span>
        )}
      </div>

      {invoice.status !== "paid" && (
        <div className="doc-toolbar mt-6 text-center">
          <a
            href={`/portal/${token}`}
            className="inline-flex rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: brand }}
          >
            Pay this invoice →
          </a>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-zinc-400">Thank you for your business — {org.name}</p>
    </DocumentShell>
  );
}
