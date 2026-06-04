import { requireContext } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const ctx = await requireContext();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar orgName={ctx.org.name} />
      <main className="min-w-0 overflow-x-hidden md:pl-60">
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
