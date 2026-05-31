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
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-zinc-50 px-6 py-20 font-sans dark:bg-black">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Multi-tenant SaaS
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Client Onboarding System
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Automated client onboarding for agencies, coaches, and consultants —
          from signing a client to renewal, tracked end-to-end on one dashboard.
        </p>
      </div>

      <ol className="flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {LIFECYCLE.map((stage, i) => (
          <li
            key={stage}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <span className="text-xs font-semibold text-zinc-400">{i + 1}</span>
            {stage}
          </li>
        ))}
      </ol>

      <div className="flex gap-3">
        <LinkButton href="/signup">Get started</LinkButton>
        <LinkButton href="/login" variant="secondary">Sign in</LinkButton>
      </div>
    </div>
  );
}
