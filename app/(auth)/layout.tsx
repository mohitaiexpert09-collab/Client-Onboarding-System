import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-600/20" />

      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white shadow-sm">
          C
        </span>
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Client Onboarding
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-8 text-xs text-zinc-400">Run your client lifecycle on autopilot.</p>
    </div>
  );
}
