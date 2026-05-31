"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Label, Select } from "@/components/ui";
import { createFormAction } from "@/app/(dashboard)/forms/actions";
import type { FormField, FormFieldType } from "@/lib/types";

const TYPES: FormFieldType[] = ["text", "textarea", "email", "url", "select", "checkbox"];

/** Lightweight intake-form builder. Serializes fields to JSON for the server action. */
export function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([
    { key: "goals", label: "What are your goals?", type: "textarea", required: true },
  ]);

  function update(i: number, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function add() {
    setFields((prev) => [...prev, { key: `field_${prev.length + 1}`, label: "", type: "text" }]);
  }
  function remove(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={createFormAction} className="space-y-5">
      <input type="hidden" name="schema" value={JSON.stringify(fields.filter((f) => f.label.trim()))} />
      <div>
        <Label htmlFor="name">Form name</Label>
        <Input id="name" name="name" required placeholder="Client intake questionnaire" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="Shown to the client at the top of the form" />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="is_intake" defaultChecked className="h-4 w-4" />
        Use as the default onboarding intake form
      </label>

      <div className="space-y-3">
        <Label>Fields</Label>
        {fields.map((f, i) => (
          <div key={i} className="flex items-end gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex-1">
              <Label>Question label</Label>
              <Input value={f.label} onChange={(e) => update(i, { label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40) || `field_${i}` })} placeholder="Question shown to client" />
            </div>
            <div className="w-32">
              <Label>Type</Label>
              <Select value={f.type} onChange={(e) => update(i, { type: e.target.value as FormFieldType })}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-1 pb-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} />
              Req
            </label>
            <button type="button" onClick={() => remove(i)} className="pb-2 text-zinc-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" /> Add field
        </Button>
      </div>

      <Button type="submit">Save form</Button>
    </form>
  );
}
