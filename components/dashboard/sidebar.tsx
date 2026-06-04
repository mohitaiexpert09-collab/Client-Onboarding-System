"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
  Workflow,
  BarChart3,
  Menu,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** Shows a spinner on the tapped link the instant navigation starts. */
function NavPending() {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" /> : null;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/contracts", label: "Contracts", icon: FileText },
      { href: "/forms", label: "Forms", icon: ClipboardList },
      { href: "/automations", label: "Automations", icon: Workflow },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {section.title}
          </p>
          {section.items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/25 dark:text-brand-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                  )}
                />
                {label}
                <NavPending />
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand({ orgName }: { orgName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">
        {orgName.charAt(0).toUpperCase()}
      </span>
      <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{orgName}</span>
    </div>
  );
}

function SignOut() {
  return (
    <form action={signOut} className="border-t border-zinc-200/70 p-3 dark:border-zinc-800">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <LogOut className="h-4 w-4 text-zinc-400" />
        Sign out
      </button>
    </form>
  );
}

export function Sidebar({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand orgName={orgName} />
        <ThemeToggle className="ml-auto" />
      </header>

      {/* Mobile drawer + overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 max-w-[85%] flex-col border-r border-zinc-200/70 bg-white shadow-xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-zinc-200/70 px-4 dark:border-zinc-800">
            <Brand orgName={orgName} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <SignOut />
        </aside>
      </div>

      {/* Desktop sidebar (fixed) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 shrink-0 flex-col border-r border-zinc-200/70 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-16 items-center border-b border-zinc-200/70 px-5 dark:border-zinc-800">
          <Brand orgName={orgName} />
        </div>
        <NavLinks />
        <SignOut />
      </aside>
    </>
  );
}
