"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { createClientAction } from "@/app/(dashboard)/clients/actions";

/** Modal to add a new client. Submits to the createClientAction server action. */
export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New client
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add client</h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={createClientAction} className="space-y-3">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="Client or contact name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="client@co.com" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Acme Inc" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+1…" />
                </div>
                <div>
                  <Label htmlFor="value">Deal value ($)</Label>
                  <Input id="value" name="value" type="number" min="0" step="1" placeholder="5000" />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={2} placeholder="Context about this client…" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add client</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
