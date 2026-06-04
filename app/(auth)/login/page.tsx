import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { Button, Card, Input, Label } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const sp = await searchParams;

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Welcome back</h1>
        <p className="text-sm text-zinc-500">Sign in to your workspace.</p>
      </div>

      {sp.message && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {sp.message}
        </p>
      )}
      {sp.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {sp.error}
        </p>
      )}

      <form action={signIn} className="space-y-4">
        <input type="hidden" name="redirect" value={sp.redirect ?? "/dashboard"} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@agency.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}
