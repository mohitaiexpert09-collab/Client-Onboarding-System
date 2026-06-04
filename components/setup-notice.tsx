import { Card } from "@/components/ui";

/** Shown when Supabase credentials are still placeholders. */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Almost there — connect Supabase
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The app is running, but it needs a database to sign in and store data. Add your
          Supabase credentials to <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> and
          restart the dev server.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            Create a free project at{" "}
            <a className="text-brand-600 underline" href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>
            .
          </li>
          <li>
            In the SQL editor, run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">db/migrations/0001_init.sql</code>{" "}
            then <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">0002_storage.sql</code>.
          </li>
          <li>
            From Project Settings → API, copy the Project URL, anon key, and service_role key
            into <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code>.
          </li>
          <li>Restart <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">npm run dev</code>.</li>
        </ol>
      </Card>
    </div>
  );
}
