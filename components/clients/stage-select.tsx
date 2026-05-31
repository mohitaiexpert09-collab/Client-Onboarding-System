"use client";

import { useTransition } from "react";
import { STAGES, type Stage } from "@/lib/types";
import { updateStageAction } from "@/app/(dashboard)/clients/actions";

/** Inline stage changer used on client cards and the detail page. */
export function StageSelect({ clientId, stage }: { clientId: string; stage: Stage }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      disabled={pending}
      value={stage}
      onChange={(e) => {
        const next = e.target.value as Stage;
        startTransition(() => updateStageAction(clientId, next));
      }}
      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      {STAGES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
