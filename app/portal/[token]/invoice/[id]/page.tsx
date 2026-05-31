import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DocumentShell } from "@/components/documents/document-shell";
import { formatMoney, type Client, type Organization, type Invoice } from "@/lib/types";

/** Client-facing, printable invoice — premium styling. */
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
  const paid = invoice.status === "paid";
  const amount = formatMoney(invoice.amount_cents, invoice.currency);

  return (
    <DocumentShell
      brandColor={brand}
      orgName={org.name}
      logoUrl={org.logo_url}
      docLabel="Invoice"
      headerRight={
        <div className="mt-1 text-sm">
          <p className="font-semibold">#{number}</p>
        </div>
      }
    >
      {/* Title + status */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Invoice</h1>
          <div className="mt-1 h-1 w-16 rounded-full" style={{ backgroundColor: brand }} />
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
            paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {paid ? "Paid" : "Due"}
        </span>
      </div>

      {/* From / Bill to / dates */}
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">From</p>
          <p className="font-semibold text-zinc-900">{org.name}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Billed to</p>
          <p className="font-semibold text-zinc-900">{client.name}</p>
          {client.company && <p className="text-sm text-zinc-600">{client.company}</p>}
          {client.email && <p className="text-sm text-zinc-500">{client.email}</p>}
        </div>
        <div className="sm:text-right">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Details</p>
          <p className="text-sm text-zinc-600">Issued {new Date(invoice.created_at).toLocaleDateString()}</p>
          {invoice.due_date && <p className="text-sm text-zinc-600">Due {new Date(invoice.due_date).toLocaleDateString()}</p>}
          {paid && invoice.paid_at && <p className="text-sm text-green-600">Paid {new Date(invoice.paid_at).toLocaleDateString()}</p>}
        </div>
      </div>

      {/* Line items */}
      <table className="mb-2 w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: brand }} className="text-white">
            <th className="rounded-l-lg px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
            <th className="rounded-r-lg px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-100">
            <td className="px-4 py-4 text-zinc-800">{invoice.description || "Professional services"}</td>
            <td className="px-4 py-4 text-right font-medium text-zinc-800">{amount}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="mb-8 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between px-4 text-sm text-zinc-500">
            <span>Subtotal</span>
            <span>{amount}</span>
          </div>
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3 text-white"
            style={{ backgroundColor: brand }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider">Total due</span>
            <span className="text-xl font-bold">{paid ? formatMoney(0, invoice.currency) : amount}</span>
          </div>
        </div>
      </div>

      {/* Pay CTA (screen only) */}
      {!paid && (
        <div className="doc-toolbar mb-8 rounded-xl bg-zinc-50 p-5 text-center">
          <p className="mb-3 text-sm text-zinc-600">Ready to get started? Complete your payment securely.</p>
          <a
            href={`/portal/${token}`}
            className="inline-flex rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: brand }}
          >
            Pay {amount} →
          </a>
        </div>
      )}

      <div className="border-t border-zinc-100 pt-5 text-center text-sm text-zinc-400">
        Thank you for your business — {org.name}
      </div>
    </DocumentShell>
  );
}
