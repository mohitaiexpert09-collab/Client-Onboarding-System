import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import {
  formatMoney,
  type Client,
  type Organization,
  type Contract,
  type Invoice,
  type Form,
  type FormField,
  type FormResponse,
  type Kickoff,
  type Milestone,
  type WeeklyReport,
  type Project,
} from "@/lib/types";
import {
  signContractAction,
  payInvoiceAction,
  submitIntakeAction,
  uploadFileAction,
  bookKickoffAction,
} from "./actions";
import { Markdown } from "@/components/documents/markdown";
import { ProjectPipeline, type PipelineResource } from "@/components/project/pipeline";

const DEFAULT_INTAKE: FormField[] = [
  { key: "goals", label: "What are your main goals for this engagement?", type: "textarea", required: true },
  { key: "website", label: "Website URL", type: "url" },
  { key: "audience", label: "Who is your target audience?", type: "textarea" },
  { key: "brand_assets", label: "Where can we find your brand assets?", type: "text" },
];

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string; submitted?: string; uploaded?: string; booked?: string; error?: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { token } = await params;
  const sp = await searchParams;

  const admin = createAdminClient();
  const { data: clientData } = await admin.from("clients").select("*").eq("portal_token", token).maybeSingle();
  if (!clientData) notFound();
  const client = clientData as Client;

  const [
    { data: orgData },
    { data: contracts },
    { data: invoices },
    { data: forms },
    { data: responses },
    { data: kickoffs },
    { data: milestones },
    { data: reports },
    { data: projects },
    { data: files },
  ] = await Promise.all([
    admin.from("organizations").select("*").eq("id", client.org_id).single(),
    admin.from("contracts").select("*").eq("client_id", client.id).in("status", ["sent", "viewed", "signed"]).order("created_at", { ascending: false }),
    admin.from("invoices").select("*").eq("client_id", client.id).neq("status", "void").order("created_at", { ascending: false }),
    admin.from("forms").select("*").eq("org_id", client.org_id).eq("is_intake", true).limit(1),
    admin.from("form_responses").select("id").eq("client_id", client.id),
    admin.from("kickoffs").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    admin.from("milestones").select("*").eq("client_id", client.id).order("created_at"),
    admin.from("weekly_reports").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    admin.from("projects").select("*").eq("client_id", client.id).limit(1),
    admin.from("files").select("id,name,kind,path").eq("client_id", client.id).order("created_at", { ascending: false }),
  ]);

  const org = orgData as Organization;
  const pendingContract = (contracts as Contract[] | null)?.find((c) => c.status !== "signed") ?? null;
  const signedContract = (contracts as Contract[] | null)?.find((c) => c.status === "signed") ?? null;
  const unpaidInvoice = (invoices as Invoice[] | null)?.find((i) => i.status !== "paid") ?? null;
  const intakeForm = (forms?.[0] as Form | undefined) ?? null;
  const intakeFields: FormField[] = intakeForm?.schema?.length ? intakeForm.schema : DEFAULT_INTAKE;
  const hasResponded = ((responses as FormResponse[] | null)?.length ?? 0) > 0;
  const kickoff = (kickoffs as Kickoff[] | null)?.[0] ?? null;

  // Signed URLs for the client's uploaded resources.
  const fileRows = (files as { id: string; name: string; kind: string | null; path: string }[] | null) ?? [];
  const resources: PipelineResource[] = await Promise.all(
    fileRows.map(async (f) => {
      const { data } = await admin.storage.from("client-files").createSignedUrl(f.path, 3600);
      return { name: f.name, kind: f.kind, url: data?.signedUrl ?? null };
    })
  );

  // The client's assigned expert (shown in their pipeline).
  let expert: { name: string; role: string | null } | null = null;
  if (client.assigned_member_id) {
    const { data: m } = await admin
      .from("team_members")
      .select("name,role")
      .eq("id", client.assigned_member_id)
      .maybeSingle();
    if (m) expert = { name: (m as { name: string }).name, role: (m as { role: string | null }).role };
  }

  const banner =
    sp.paid ? "Payment received — thank you!"
    : sp.submitted ? "Thanks! Your responses were submitted."
    : sp.uploaded ? "File uploaded successfully."
    : sp.booked ? "Your kickoff call is booked!"
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">{org.name}</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Welcome, {client.name} 👋</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-6 py-8">
        {banner && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">{banner}</div>
        )}
        {sp.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{sp.error}</div>
        )}

        {/* 1. Sign contract */}
        {pendingContract && (
          <Card>
            <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">1 · Sign your agreement</h2>
            <p className="mb-3 text-sm text-zinc-500">{pendingContract.title}</p>
            {pendingContract.body && (
              <div className="mb-3 max-h-48 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <Markdown content={pendingContract.body} className="text-sm" />
              </div>
            )}
            <div className="mb-3">
              <a href={`/portal/${token}/document/${pendingContract.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                View &amp; download full document (PDF) →
              </a>
            </div>
            <form action={signContractAction} className="flex items-end gap-2">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="contract_id" value={pendingContract.id} />
              <div className="flex-1">
                <Label htmlFor="signer">Type your full name to sign</Label>
                <Input id="signer" name="signer_name" required placeholder="Your full name" />
              </div>
              <Button type="submit">Sign</Button>
            </form>
          </Card>
        )}
        {signedContract && !pendingContract && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Agreement signed</h2>
              <Badge color="green">Signed</Badge>
            </div>
          </Card>
        )}

        {/* 2. Pay invoice */}
        {unpaidInvoice && (
          <Card>
            <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">2 · Complete payment</h2>
            <p className="mb-3 text-sm text-zinc-500">
              {unpaidInvoice.description} — <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatMoney(unpaidInvoice.amount_cents, unpaidInvoice.currency)}</span>
            </p>
            <div className="mb-3">
              <a href={`/portal/${token}/invoice/${unpaidInvoice.id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                View &amp; download invoice (PDF) →
              </a>
            </div>
            <form action={payInvoiceAction}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="invoice_id" value={unpaidInvoice.id} />
              <Button type="submit">Pay {formatMoney(unpaidInvoice.amount_cents, unpaidInvoice.currency)}</Button>
            </form>
          </Card>
        )}

        {/* 3. Onboarding form */}
        {!hasResponded && (
          <Card>
            <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">3 · Onboarding questionnaire</h2>
            <p className="mb-3 text-sm text-zinc-500">Tell us a bit so we can get started.</p>
            <form action={submitIntakeAction} className="space-y-3">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="form_id" value={intakeForm?.id ?? "default"} />
              {intakeFields.map((f) => (
                <div key={f.key}>
                  <Label htmlFor={f.key}>{f.label}{f.required ? " *" : ""}</Label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={f.key}
                      name={f.key}
                      required={f.required}
                      rows={3}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  ) : (
                    <Input id={f.key} name={f.key} type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} required={f.required} />
                  )}
                </div>
              ))}
              <Button type="submit">Submit</Button>
            </form>
          </Card>
        )}

        {/* 4. Upload access */}
        <Card>
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">4 · Share files &amp; access</h2>
          <p className="mb-3 text-sm text-zinc-500">Upload brand assets or securely share access details.</p>
          <form action={uploadFileAction} className="flex items-end gap-2">
            <input type="hidden" name="token" value={token} />
            <div className="flex-1">
              <input type="file" name="file" required className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700" />
            </div>
            <select name="kind" defaultValue="asset" className="h-10 rounded-lg border border-zinc-300 px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="asset">Asset</option>
              <option value="credential">Credential</option>
            </select>
            <Button type="submit">Upload</Button>
          </form>
        </Card>

        {/* 5. Book kickoff */}
        <Card>
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">5 · Book your kickoff call</h2>
          {kickoff?.status === "booked" ? (
            <p className="text-sm text-green-600">Booked for {new Date(kickoff.scheduled_at!).toLocaleString()}</p>
          ) : (
            <form action={bookKickoffAction} className="flex items-end gap-2">
              <input type="hidden" name="token" value={token} />
              <div className="flex-1">
                <Label htmlFor="ko">Pick a time</Label>
                <Input id="ko" name="scheduled_at" type="datetime-local" required />
              </div>
              <Button type="submit">Book</Button>
            </form>
          )}
        </Card>

        {/* Client workspace */}
        {(() => {
          const ms = (milestones as Milestone[] | null) ?? [];
          const rs = (reports as WeeklyReport[] | null) ?? [];
          const project = (projects?.[0] as Project | undefined) ?? null;
          const hasWorkspace =
            ms.length > 0 || rs.length > 0 || resources.length > 0 || !!project?.slack_url || !!project?.whatsapp_url || !!client.scope;
          if (!hasWorkspace) return null;

          return (
            <>
              <div className="pt-2">
                <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your project</h2>
                <p className="text-sm text-zinc-500">Track progress and updates in one place.</p>
              </div>

              <ProjectPipeline
                stage={client.stage}
                timelineDays={client.timeline_days}
                startDate={kickoff?.scheduled_at ?? client.created_at}
                scope={client.scope}
                deliverables={client.deliverables}
                valueCents={client.value_cents}
                paymentStructure={client.payment_structure}
                milestones={ms}
                resources={resources}
                slackUrl={project?.slack_url}
                whatsappUrl={project?.whatsapp_url}
                expert={expert}
              />

              {rs.length > 0 && (
                <Card>
                  <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Weekly updates</h3>
                  <div className="space-y-3">
                    {rs.map((r) => (
                      <div key={r.id} className="rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-800">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{r.title || "Weekly update"}</span>
                          <span className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {r.completed && <p className="text-zinc-600 dark:text-zinc-400"><strong>Completed:</strong> {r.completed}</p>}
                        {r.in_progress && <p className="text-zinc-600 dark:text-zinc-400"><strong>In progress:</strong> {r.in_progress}</p>}
                        {r.blockers && <p className="text-zinc-600 dark:text-zinc-400"><strong>Needed from you:</strong> {r.blockers}</p>}
                        {r.next_steps && <p className="text-zinc-600 dark:text-zinc-400"><strong>Next:</strong> {r.next_steps}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          );
        })()}

        <p className="pt-4 text-center text-xs text-zinc-400">Powered by {org.name}</p>
      </div>
    </div>
  );
}
