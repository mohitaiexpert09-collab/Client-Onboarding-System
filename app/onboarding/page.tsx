import { redirect } from "next/navigation";
import { createOrganization } from "@/app/auth/actions";
import { getContext, getCurrentUser } from "@/lib/auth";
import { Button, Card, Input, Label } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getContext();
  if (ctx) redirect("/dashboard");

  const sp = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-sm">
        <Card className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Name your workspace
            </h1>
            <p className="text-sm text-zinc-500">
              This is your agency / coaching business. You can invite your team later.
            </p>
          </div>
          {sp.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {sp.error}
            </p>
          )}
          <form action={createOrganization} className="space-y-4">
            <div>
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" name="name" required placeholder="Acme Agency" />
            </div>
            <Button type="submit" className="w-full">
              Create workspace
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
