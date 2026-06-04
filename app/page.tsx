import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui";

const LIFECYCLE = [
  "Client Signs",
  "Contract",
  "Payment",
  "Welcome Email",
  "Onboarding Form",
  "Collect Access",
  "Kickoff Call",
  "Slack/WhatsApp",
  "Project Setup",
  "Quick Win",
  "Weekly Updates",
  "Delivery",
  "Renewal / Upsell",
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-6 py-20 dark:bg-zinc-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px] dark:bg-brand-600/20" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 shadow-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Multi-tenant SaaS for agencies &amp; consultants
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Client onboarding,{" "}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            on autopilot
          </span>
        </h1>
        <p className="max-w-xl text-balance text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          You close the deal — the system runs everything after the &ldquo;yes.&rdquo; Contract,
          payment, onboarding, delivery, and renewal, tracked end-to-end on one dashboard.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/signup" className="group">
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </LinkButton>
          <LinkButton href="/login" variant="secondary">
            Sign in
          </LinkButton>
        </div>
      </div>

      <ol className="mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {LIFECYCLE.map((stage, i) => (
          <li
            key={stage}
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-xs transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-800"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
              {i + 1}
            </span>
            {stage}
          </li>
        ))}
      </ol>
    </div>
  );
}
