import { requireContext } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/setup-notice";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const ctx = await requireContext();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar orgName={ctx.org.name} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
