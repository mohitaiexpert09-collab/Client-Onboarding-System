import { PrintButton } from "./print-button";

/**
 * Branded "paper" wrapper for client-facing documents (proposals, contracts,
 * invoices). Renders a centered white sheet with the agency's brand color and a
 * Download-PDF action. The embedded print styles strip the page background and
 * the toolbar so the saved PDF is just the document itself.
 */
export function DocumentShell({
  brandColor,
  orgName,
  docLabel,
  children,
}: {
  brandColor: string;
  orgName: string;
  docLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100 py-8 dark:bg-zinc-950 print:bg-white print:py-0">
      <style>{`
        @media print {
          .doc-toolbar { display: none !important; }
          .doc-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          @page { margin: 1.6cm; }
        }
      `}</style>

      <div className="doc-toolbar mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4">
        <span className="text-sm text-zinc-500">{docLabel}</span>
        <PrintButton />
      </div>

      <div className="doc-sheet mx-auto max-w-[820px] rounded-xl bg-white p-10 shadow-xl print:p-0 dark:bg-white">
        <div className="mb-8 flex items-center justify-between border-b pb-6" style={{ borderColor: brandColor }}>
          <div className="text-2xl font-bold tracking-tight" style={{ color: brandColor }}>
            {orgName}
          </div>
          <div className="text-right text-xs uppercase tracking-widest text-zinc-400">{docLabel}</div>
        </div>
        <div className="text-zinc-800">{children}</div>
      </div>
    </div>
  );
}
