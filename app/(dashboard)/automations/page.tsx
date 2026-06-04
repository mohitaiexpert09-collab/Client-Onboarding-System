import { requireContext } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui";
import { ArrowRight } from "lucide-react";

const BUILT_IN = [
  {
    trigger: "Contract signed",
    actions: ["Auto-create deposit invoice", "Send payment link", "Advance to Payment"],
  },
  {
    trigger: "Payment succeeded",
    actions: ["Send welcome email", "Advance to Welcome", "Seed onboarding checklist"],
  },
  {
    trigger: "Onboarding form sent",
    actions: ["Email client the questionnaire", "Advance to Onboarding Form"],
  },
  {
    trigger: "Form submitted",
    actions: ["Notify owner", "Advance to Collect Access"],
  },
  {
    trigger: "Kickoff booked",
    actions: ["Create Quick Win milestone", "Advance to Project Setup"],
  },
  {
    trigger: "Weekly (cron)",
    actions: ["Send weekly update digest to active clients (requires Inngest worker)"],
  },
];

export default async function AutomationsPage() {
  await requireContext();

  return (
    <div>
      <PageHeader
        title="Automations"
        subtitle="The lifecycle runs itself — these rules fire automatically"
      />
      <div className="space-y-3 p-4 sm:p-6 lg:p-8">
        {BUILT_IN.map((a) => (
          <Card key={a.trigger} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge color="indigo">When</Badge>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.trigger}</span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
            <div className="flex flex-1 flex-wrap justify-end gap-2">
              {a.actions.map((act) => (
                <span key={act} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {act}
                </span>
              ))}
            </div>
          </Card>
        ))}
        <p className="pt-2 text-sm text-zinc-500">
          A visual rule builder (custom triggers, conditions, and actions) is planned for Phase 2.
        </p>
      </div>
    </div>
  );
}
