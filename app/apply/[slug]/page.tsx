import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { submitLeadAction } from "./actions";
import type { Organization } from "@/lib/types";

/** Public, brandable lead-capture form. Shareable URL for ads/website/bio. */
export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; proposal?: string; error?: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { slug } = await params;
  const sp = await searchParams;

  const admin = createAdminClient();
  const { data } = await admin.from("organizations").select("*").eq("slug", slug).maybeSingle();
  const org = data as Organization | null;
  if (!org || !org.lead_form_enabled) notFound();

  const accent = org.brand_color || "#4f46e5";

  if (sp.submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-black">
        <Card className="max-w-md text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl" style={{ background: `${accent}22` }}>
            🎉
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Thank you!</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {sp.proposal
              ? `We've emailed you a proposal from ${org.name}. Check your inbox to review and sign.`
              : `${org.name} has received your details and will be in touch shortly.`}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium" style={{ color: accent }}>{org.name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Let&apos;s work together</h1>
          {org.lead_intro && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{org.lead_intro}</p>}
        </div>

        <Card>
          {sp.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{sp.error}</p>
          )}
          <form action={submitLeadAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div>
              <Label htmlFor="name">Your name *</Label>
              <Input id="name" name="name" required placeholder="John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required placeholder="john@company.com" />
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
                <Label htmlFor="budget">Budget ($)</Label>
                <Input id="budget" name="budget" type="number" min="0" placeholder="2000" />
              </div>
            </div>
            <div>
              <Label htmlFor="scope">What do you need help with?</Label>
              <Textarea id="scope" name="scope" rows={4} placeholder="Describe your goals, project, or the outcome you want…" />
            </div>
            <Button type="submit" className="w-full" style={{ background: accent }}>
              Submit
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-zinc-400">Powered by {org.name}</p>
      </div>
    </div>
  );
}
