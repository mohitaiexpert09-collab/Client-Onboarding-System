import { requireContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge, Button } from "@/components/ui";
import { FormBuilder } from "@/components/forms/form-builder";
import { deleteFormAction } from "./actions";
import type { Form } from "@/lib/types";

export default async function FormsPage() {
  await requireContext();
  const supabase = await createClient();
  const { data } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
  const forms = (data ?? []) as Form[];

  return (
    <div>
      <PageHeader title="Forms" subtitle="Build intake questionnaires clients fill out in their portal" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:p-8">
        <div className="space-y-3">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Your forms</h2>
          {forms.length === 0 ? (
            <Card><p className="text-sm text-zinc-500">No forms yet. Create one to collect onboarding info.</p></Card>
          ) : (
            forms.map((f) => (
              <Card key={f.id} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{f.name}</p>
                    {f.is_intake && <Badge color="indigo">Intake</Badge>}
                  </div>
                  <p className="text-xs text-zinc-500">{f.schema.length} field{f.schema.length === 1 ? "" : "s"}</p>
                </div>
                <form action={deleteFormAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <Button size="sm" variant="ghost" type="submit">Delete</Button>
                </form>
              </Card>
            ))
          )}
        </div>
        <Card>
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">New form</h2>
          <FormBuilder />
        </Card>
      </div>
    </div>
  );
}
