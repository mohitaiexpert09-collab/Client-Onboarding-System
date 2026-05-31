import { Card, Badge } from "@/components/ui";
import { stageProgress, STAGE_LABEL, formatMoney, type Stage, type Milestone } from "@/lib/types";

export interface PipelineResource {
  name: string;
  url?: string | null;
  kind?: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  full: "100% upfront",
  split: "50% / 50%",
  retainer: "Monthly retainer",
};

function Meter({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * The per-client project pipeline: engagement snapshot, timeline + deadline
 * countdown, progress meters (lifecycle / milestones / time), milestone
 * deadlines, and a resources list. Used in both the owner dashboard (variant
 * "owner") and the client portal (variant "client").
 */
export function ProjectPipeline({
  stage,
  timelineDays,
  startDate,
  scope,
  deliverables,
  valueCents,
  paymentStructure,
  milestones,
  resources = [],
  slackUrl,
  whatsappUrl,
  expert,
}: {
  stage: Stage;
  timelineDays: number | null;
  startDate: string | null;
  scope: string | null;
  deliverables: string | null;
  valueCents?: number;
  paymentStructure?: string;
  milestones: Milestone[];
  resources?: PipelineResource[];
  slackUrl?: string | null;
  whatsappUrl?: string | null;
  expert?: { name: string; role: string | null } | null;
}) {
  const lifecyclePct = stageProgress(stage);
  const doneCount = milestones.filter((m) => m.status === "done").length;
  const msPct = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;

  const start = startDate ? new Date(startDate) : null;
  let deadline: Date | null = null;
  let daysRemaining: number | null = null;
  let timePct: number | null = null;
  if (start && timelineDays && timelineDays > 0) {
    deadline = new Date(start.getTime() + timelineDays * 86400000);
    const total = timelineDays * 86400000;
    const elapsed = Date.now() - start.getTime();
    timePct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
    daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
  }

  const now = Date.now();

  return (
    <div className="space-y-4">
      {/* Snapshot + countdown */}
      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Project pipeline</h3>
            <p className="text-sm text-zinc-500">Current stage: {STAGE_LABEL[stage]}</p>
          </div>
          {deadline && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Target delivery</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{deadline.toLocaleDateString()}</p>
              {daysRemaining !== null && (
                <p className={`text-xs ${daysRemaining < 0 ? "text-red-500" : daysRemaining <= 7 ? "text-amber-500" : "text-zinc-400"}`}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Meter label="Lifecycle" pct={lifecyclePct} color="bg-indigo-600" />
          {milestones.length > 0 && <Meter label="Milestones delivered" pct={msPct} color="bg-green-500" />}
          {timePct !== null && (
            <Meter label="Timeline elapsed" pct={timePct} color={timePct > 90 ? "bg-red-500" : "bg-blue-500"} />
          )}
        </div>

        {expert && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {expert.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400">Your dedicated expert</p>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {expert.name}
                {expert.role ? ` · ${expert.role}` : ""}
              </p>
            </div>
          </div>
        )}

        {(scope || deliverables || valueCents || timelineDays) && (
          <dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            {!!valueCents && valueCents > 0 && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-zinc-400">Value</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatMoney(valueCents)} {paymentStructure ? `· ${PAYMENT_LABELS[paymentStructure] ?? paymentStructure}` : ""}
                </dd>
              </div>
            )}
            {timelineDays && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-zinc-400">Timeline</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">{timelineDays} days</dd>
              </div>
            )}
            {scope && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-zinc-400">Scope</dt>
                <dd className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{scope}</dd>
              </div>
            )}
            {deliverables && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-zinc-400">Deliverables</dt>
                <dd className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{deliverables}</dd>
              </div>
            )}
          </dl>
        )}

        {(slackUrl || whatsappUrl) && (
          <div className="mt-4 flex gap-3 border-t pt-4">
            {slackUrl && <a href={slackUrl} className="text-sm font-medium text-indigo-600 hover:underline">💬 Slack channel →</a>}
            {whatsappUrl && <a href={whatsappUrl} className="text-sm font-medium text-indigo-600 hover:underline">📱 WhatsApp →</a>}
          </div>
        )}
      </Card>

      {/* Milestone deadlines */}
      {milestones.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Milestones &amp; deadlines</h3>
          <ol className="relative space-y-3 border-l border-zinc-200 pl-5 dark:border-zinc-800">
            {milestones.map((m) => {
              const overdue = m.due_date && m.status !== "done" && new Date(m.due_date).getTime() < now;
              return (
                <li key={m.id} className="relative">
                  <span
                    className={`absolute -left-[1.42rem] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      m.status === "done" ? "bg-green-500" : m.status === "in_progress" ? "bg-amber-500" : "bg-zinc-300"
                    }`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{m.title}</span>
                    <div className="flex items-center gap-2">
                      {m.due_date && (
                        <span className={`text-xs ${overdue ? "font-medium text-red-500" : "text-zinc-400"}`}>
                          {overdue ? "Overdue · " : "Due "}
                          {new Date(m.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <Badge color={m.status === "done" ? "green" : m.status === "in_progress" ? "amber" : "zinc"}>
                        {m.status === "in_progress" ? "in progress" : m.status}
                      </Badge>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Resources</h3>
          <ul className="space-y-2">
            {resources.map((r, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  📎 {r.name}
                  {r.kind && <span className="text-xs text-zinc-400">({r.kind})</span>}
                </span>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">
                    Open →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
