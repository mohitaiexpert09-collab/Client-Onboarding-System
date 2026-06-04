import { ThemeToggle } from "@/components/theme-toggle";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 lg:px-8 dark:border-zinc-800">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <span className="hidden md:inline-flex">
          <ThemeToggle />
        </span>
      </div>
    </div>
  );
}
