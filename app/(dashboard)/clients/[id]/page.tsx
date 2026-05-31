import { notFound } from "next/navigation";
import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge, Button, Input, Label, Textarea, Select } from "@/components/ui";
import { StageSelect } from "@/components/clients/stage-select";
import { CopyLink } from "@/components/clients/copy-link";
import { AiPanel } from "@/components/clients/ai-panel";
import { publicEnv, isAIConfigured } from "@/lib/env";
import {
  STAGE_LABEL,
  stageProgress,
  formatMoney,
  type Client,
  type Contract,
  type Invoice,
  type Task,
  type Milestone,
  type FormResponse,
  type ClientFile,
  type Kickoff,
  type Project,
  type ActivityEntry,
  type WeeklyReport,
} from "@/lib/types";
import {
  createContractAction,
  sendContractAction,
  createInvoiceAction,
  markInvoicePaidAction,
  addTaskAction,
  toggleTaskAction,
  addMilestoneAction,
  updateMilestoneAction,
  setChannelsAction,
  scheduleKickoffAction,
  sendIntakeFormAction,
  sendWelcomeEmailAction,
  updateEngagementAction,
  addWeeklyReportAction,
} from "./actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();
  const supabase = await createClient();

  const { data: clientData } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!clientData) notFound();
  const client = clientData as Client;

  const [
    { data: contracts },
    { data: invoices },
    { data: tasks },
    { data: milestones },
    { data: responses },
    { data: files },
    { data: kickoffs },
    { data: projects },
    { data: reports },
    { data: activity },
  ] = await Promise.all([
    supabase.from("contracts").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("client_id", id).order("created_at"),
    supabase.from("milestones").select("*").eq("client_id", id).order("created_at"),
    supabase.from("form_responses").select("*").eq("client_id", id).order("submitted_at", { ascending: false }),
    supabase.from("files").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("kickoffs").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("*").eq("client_id", id).limit(1),
    supabase.from("weekly_reports").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_log").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const project = (projects?.[0] ?? null) as Project | null;
  const portalUrl = `${publicEnv.appUrl}/portal/${client.portal_token}`;
  const cid = <input type="hidden" name="client_id" value={client.id} />;

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={[client.company, client.email].filter(Boolean).join(" · ") || "Client"}
        action={
          <div className="flex items-center gap-3">
            <Badge color="indigo">{STAGE_LABEL[client.stage]}</Badge>
            <div className="w-44">
              <StageSelect clientId={client.id} stage={client.stage} />
            </div>
          </div>
        }
      />

      <div className="grid gap-6 p-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Lifecycle progress</h2>
              <span className="text-sm text-zinc-500">{stageProgress(client.stage)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-indigo-600" style={{ width: `${stageProgress(client.stage)}%` }} />
            </div>
          </Card>

          {/* Engagement */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Engagement</h2>
            <form action={updateEngagementAction} className="space-y-3">
              {cid}
              <div>
                <Label htmlFor="scope">Scope of work</Label>
                <Textarea id="scope" name="scope" rows={2} defaultValue={client.scope ?? ""} placeholder="e.g. Build AI appointment-setting system" />
              </div>
              <div>
                <Label htmlFor="deliverables">Deliverables</Label>
                <Textarea id="deliverables" name="deliverables" rows={2} defaultValue={client.deliverables ?? ""} placeholder="What the client receives…" />
              </div>
              <div className="flex items-end gap-3">
                <div className="w-32">
                  <Label htmlFor="timeline_days">Timeline (days)</Label>
                  <Input id="timeline_days" name="timeline_days" type="number" min="0" defaultValue={client.timeline_days ?? ""} placeholder="14" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="payment_structure">Payment structure</Label>
                  <Select id="payment_structure" name="payment_structure" defaultValue={client.payment_structure}>
                    <option value="full">100% upfront</option>
                    <option value="split">50% upfront / 50% on completion</option>
                    <option value="retainer">Monthly retainer</option>
                  </Select>
                </div>
                <Button size="sm" type="submit">Save</Button>
              </div>
            </form>
          </Card>

          {/* Contracts */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Contracts</h2>
            <div className="space-y-2">
              {(contracts as Contract[] | null)?.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.title}</p>
                    {c.signed_at && <p className="text-xs text-zinc-500">Signed by {c.signer_name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={c.status === "signed" ? "green" : c.status === "sent" ? "amber" : "zinc"}>{c.status}</Badge>
                    <a href={`${portalUrl}/document/${c.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">PDF</a>
                    {c.status === "draft" && (
                      <form action={sendContractAction}>
                        {cid}
                        <input type="hidden" name="contract_id" value={c.id} />
                        <Button size="sm" variant="secondary">Send</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
              {(!contracts || contracts.length === 0) && <p className="text-sm text-zinc-500">No contracts yet.</p>}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Draft a contract</summary>
              <form action={createContractAction} className="mt-3 space-y-2">
                {cid}
                <Input name="title" placeholder="Service Agreement" defaultValue="Service Agreement" />
                <Textarea name="body" rows={4} placeholder="Contract terms…" />
                <Button size="sm" type="submit">Save draft</Button>
              </form>
            </details>
          </Card>

          {/* Invoices */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Payments</h2>
            <div className="space-y-2">
              {(invoices as Invoice[] | null)?.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{inv.description}</p>
                    <p className="text-xs text-zinc-500">{formatMoney(inv.amount_cents, inv.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={inv.status === "paid" ? "green" : inv.status === "sent" ? "amber" : "zinc"}>{inv.status}</Badge>
                    <a href={`${portalUrl}/invoice/${inv.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">PDF</a>
                    {inv.status !== "paid" && (
                      <form action={markInvoicePaidAction}>
                        {cid}
                        <input type="hidden" name="invoice_id" value={inv.id} />
                        <Button size="sm" variant="secondary">Mark paid</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
              {(!invoices || invoices.length === 0) && <p className="text-sm text-zinc-500">No invoices yet.</p>}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Create invoice</summary>
              <form action={createInvoiceAction} className="mt-3 flex items-end gap-2">
                {cid}
                <div className="flex-1">
                  <Label htmlFor="inv-desc">Description</Label>
                  <Input id="inv-desc" name="description" placeholder="Deposit" defaultValue="Deposit" />
                </div>
                <div className="w-28">
                  <Label htmlFor="inv-amt">Amount ($)</Label>
                  <Input id="inv-amt" name="amount" type="number" min="0" defaultValue="500" />
                </div>
                <Button size="sm" type="submit">Send</Button>
              </form>
            </details>
          </Card>

          {/* Milestones */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Milestones &amp; delivery</h2>
            <div className="space-y-2">
              {(milestones as Milestone[] | null)?.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {m.type === "quick_win" && <Badge color="blue">Quick Win</Badge>}
                    {m.type === "delivery" && <Badge color="indigo">Delivery</Badge>}
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{m.title}</span>
                  </div>
                  <form action={updateMilestoneAction} className="flex items-center gap-2">
                    {cid}
                    <input type="hidden" name="milestone_id" value={m.id} />
                    <Select name="status" defaultValue={m.status} className="h-8 w-32 text-xs">
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </Select>
                    <Button size="sm" variant="ghost" type="submit">Save</Button>
                  </form>
                </div>
              ))}
              {(!milestones || milestones.length === 0) && <p className="text-sm text-zinc-500">No milestones yet.</p>}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Add milestone</summary>
              <form action={addMilestoneAction} className="mt-3 flex items-end gap-2">
                {cid}
                <div className="flex-1">
                  <Input name="title" placeholder="Milestone title" required />
                </div>
                <Select name="type" defaultValue="general" className="w-32">
                  <option value="general">General</option>
                  <option value="quick_win">Quick Win</option>
                  <option value="delivery">Delivery</option>
                </Select>
                <Button size="sm" type="submit">Add</Button>
              </form>
            </details>
          </Card>

          {/* Tasks */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Tasks</h2>
            <div className="space-y-1">
              {(tasks as Task[] | null)?.map((t) => (
                <form key={t.id} action={toggleTaskAction} className="flex items-center gap-2 py-1">
                  {cid}
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="done" value={t.status === "done" ? "false" : "true"} />
                  <button type="submit" className="flex items-center gap-2 text-left">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        t.status === "done" ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300"
                      }`}
                    >
                      {t.status === "done" ? "✓" : ""}
                    </span>
                    <span className={`text-sm ${t.status === "done" ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {t.title}
                    </span>
                  </button>
                  <Badge color={t.assignee === "client" ? "amber" : "zinc"} className="ml-auto">{t.assignee}</Badge>
                </form>
              ))}
              {(!tasks || tasks.length === 0) && <p className="text-sm text-zinc-500">No tasks yet.</p>}
            </div>
            <form action={addTaskAction} className="mt-3 flex items-end gap-2">
              {cid}
              <div className="flex-1"><Input name="title" placeholder="New task" required /></div>
              <Select name="assignee" defaultValue="owner" className="w-28">
                <option value="owner">Owner</option>
                <option value="client">Client</option>
              </Select>
              <Button size="sm" type="submit">Add</Button>
            </form>
          </Card>

          {/* Weekly reports */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Weekly reports</h2>
            <div className="space-y-3">
              {(reports as WeeklyReport[] | null)?.map((r) => (
                <div key={r.id} className="rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-800">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{r.title || "Weekly update"}</span>
                    <span className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.completed && <p className="text-zinc-600 dark:text-zinc-400"><strong>Completed:</strong> {r.completed}</p>}
                  {r.in_progress && <p className="text-zinc-600 dark:text-zinc-400"><strong>In progress:</strong> {r.in_progress}</p>}
                  {r.blockers && <p className="text-zinc-600 dark:text-zinc-400"><strong>Blockers:</strong> {r.blockers}</p>}
                  {r.next_steps && <p className="text-zinc-600 dark:text-zinc-400"><strong>Next:</strong> {r.next_steps}</p>}
                </div>
              ))}
              {(!reports || reports.length === 0) && <p className="text-sm text-zinc-500">No reports yet.</p>}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ New weekly report</summary>
              <form action={addWeeklyReportAction} className="mt-3 space-y-2">
                {cid}
                <Input name="title" placeholder="Report title (optional)" />
                <Textarea name="completed" rows={2} placeholder="✅ What was completed this week" />
                <Textarea name="in_progress" rows={2} placeholder="🔄 What's in progress" />
                <Textarea name="blockers" rows={2} placeholder="⛔ Blockers / what's needed from the client" />
                <Textarea name="next_steps" rows={2} placeholder="➡️ Next steps" />
                <Button size="sm" type="submit">Send report</Button>
              </form>
            </details>
          </Card>

          {/* Intake responses */}
          {responses && responses.length > 0 && (
            <Card>
              <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Onboarding responses</h2>
              {(responses as FormResponse[]).map((r) => (
                <div key={r.id} className="space-y-1">
                  {Object.entries(r.answers).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          )}

          {/* Files */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Files &amp; access</h2>
            {files && files.length > 0 ? (
              <ul className="space-y-1">
                {(files as ClientFile[]).map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-800 dark:text-zinc-200">{f.name}</span>
                    <Badge color={f.kind === "credential" ? "red" : "zinc"}>{f.kind}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No files uploaded yet (clients upload via the portal).</p>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Portal link */}
          <Card>
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">Client portal</h2>
            <p className="mb-3 text-xs text-zinc-500">Share this secure link — no login needed.</p>
            <CopyLink url={portalUrl} />
          </Card>

          {/* Quick actions */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Quick actions</h2>
            <div className="space-y-2">
              <form action={sendWelcomeEmailAction}>{cid}<Button size="sm" variant="secondary" className="w-full">Send welcome email</Button></form>
              <form action={sendIntakeFormAction}>{cid}<Button size="sm" variant="secondary" className="w-full">Send onboarding form</Button></form>
            </div>
          </Card>

          {/* AI assists */}
          <AiPanel
            clientId={client.id}
            aiConfigured={isAIConfigured()}
            aiBrief={client.ai_brief}
            hasResponses={!!responses && responses.length > 0}
          />

          {/* Channels */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Communication channel</h2>
            <form action={setChannelsAction} className="space-y-2">
              {cid}
              <div>
                <Label htmlFor="slack">Slack channel URL</Label>
                <Input id="slack" name="slack_url" defaultValue={project?.slack_url ?? ""} placeholder="https://slack.com/…" />
              </div>
              <div>
                <Label htmlFor="wa">WhatsApp group URL</Label>
                <Input id="wa" name="whatsapp_url" defaultValue={project?.whatsapp_url ?? ""} placeholder="https://chat.whatsapp.com/…" />
              </div>
              <Button size="sm" type="submit">Save channels</Button>
            </form>
          </Card>

          {/* Kickoff */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Kickoff call</h2>
            {(kickoffs as Kickoff[] | null)?.[0]?.status === "booked" ? (
              <p className="text-sm text-green-600">
                Booked for {new Date((kickoffs as Kickoff[])[0].scheduled_at!).toLocaleString()}
              </p>
            ) : (
              <form action={scheduleKickoffAction} className="space-y-2">
                {cid}
                <Input name="scheduled_at" type="datetime-local" />
                <Input name="location" placeholder="Zoom / Google Meet link" />
                <Button size="sm" type="submit">Schedule</Button>
              </form>
            )}
          </Card>

          {/* Details */}
          <Card>
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">Details</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Deal value</dt><dd className="text-zinc-800 dark:text-zinc-200">{formatMoney(client.value_cents)}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Status</dt><dd className="text-zinc-800 dark:text-zinc-200">{client.status}</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Added</dt><dd className="text-zinc-800 dark:text-zinc-200">{new Date(client.created_at).toLocaleDateString()}</dd></div>
            </dl>
            {client.notes && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{client.notes}</p>}
          </Card>

          {/* Activity */}
          <Card>
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            <ul className="space-y-2">
              {(activity as ActivityEntry[] | null)?.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-zinc-700 dark:text-zinc-300">{a.message}</p>
                  <p className="text-xs text-zinc-400">{new Date(a.created_at).toLocaleString()}</p>
                </li>
              ))}
              {(!activity || activity.length === 0) && <p className="text-sm text-zinc-500">No activity yet.</p>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
