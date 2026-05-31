"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles, Copy, Check } from "lucide-react";
import { Card, Button, Textarea } from "@/components/ui";
import { createContractAction } from "@/app/(dashboard)/clients/[id]/actions";
import { aiDraftContract, aiSummarizeIntake, aiDraftWeeklyUpdate, type AIResult } from "@/app/(dashboard)/clients/[id]/ai-actions";

const EMPTY: AIResult = {};

function PendingButton({ children, size = "sm" }: { children: React.ReactNode; size?: "sm" | "md" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} disabled={pending}>
      <Sparkles className="h-4 w-4" />
      {pending ? "Generating…" : children}
    </Button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function AiPanel({
  clientId,
  aiConfigured,
  aiBrief,
  hasResponses,
}: {
  clientId: string;
  aiConfigured: boolean;
  aiBrief: string | null;
  hasResponses: boolean;
}) {
  const [contract, draftContractAction] = useActionState(aiDraftContract, EMPTY);
  const [weekly, draftWeeklyAction] = useActionState(aiDraftWeeklyUpdate, EMPTY);

  if (!aiConfigured) {
    return (
      <Card>
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">AI assists</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Add <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">OPENAI_API_KEY</code> to{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> to enable AI contract
          drafting, intake summaries, and weekly update drafts.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">AI assists</h2>
      </div>

      <div className="space-y-5">
        {/* Draft contract */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Draft a contract</p>
          <form action={draftContractAction} className="space-y-2">
            <input type="hidden" name="client_id" value={clientId} />
            <Textarea name="prompt" rows={2} placeholder="e.g. 3-month SEO retainer, $2k/mo, monthly reporting…" />
            <PendingButton>Generate contract</PendingButton>
          </form>
          {contract.error && <p className="mt-2 text-sm text-red-600">{contract.error}</p>}
          {contract.text && (
            <div className="mt-3 space-y-2">
              <form action={createContractAction} className="space-y-2">
                <input type="hidden" name="client_id" value={clientId} />
                <input type="hidden" name="title" value="Service Agreement" />
                <Textarea name="body" rows={8} defaultValue={contract.text} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save as draft</Button>
                  <CopyButton text={contract.text} />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Summarize intake */}
        {hasResponses && (
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Intake brief</p>
              <form action={aiSummarizeIntake}>
                <input type="hidden" name="client_id" value={clientId} />
                <PendingButton>{aiBrief ? "Regenerate" : "Summarize intake"}</PendingButton>
              </form>
            </div>
            {aiBrief && (
              <div className="mt-3 whitespace-pre-wrap rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {aiBrief}
              </div>
            )}
          </div>
        )}

        {/* Weekly update */}
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Weekly update email</p>
          <form action={draftWeeklyAction}>
            <input type="hidden" name="client_id" value={clientId} />
            <PendingButton>Draft weekly update</PendingButton>
          </form>
          {weekly.error && <p className="mt-2 text-sm text-red-600">{weekly.error}</p>}
          {weekly.text && (
            <div className="mt-3 space-y-2">
              <Textarea rows={8} defaultValue={weekly.text} readOnly />
              <CopyButton text={weekly.text} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
