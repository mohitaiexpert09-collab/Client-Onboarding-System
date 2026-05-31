import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <Link href="/" className="mb-8 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Client Onboarding System
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
