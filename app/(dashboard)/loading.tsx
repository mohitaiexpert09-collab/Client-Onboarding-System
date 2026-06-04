/** Instant skeleton shown the moment a dashboard route is navigated to. */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200/70 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 dark:border-zinc-800">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-56 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        </div>
        <div className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Body */}
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-5">
              <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/60" />
              <div className="mt-3 h-6 w-16 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <div className="rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="mb-5 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="mb-5 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
