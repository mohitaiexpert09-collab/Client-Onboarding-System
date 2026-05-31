import { PrintButton } from "./print-button";

/** Pick black or white text for legibility on a given hex background. */
function readableText(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "#ffffff";
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  // Perceived luminance (sRGB)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#18181b" : "#ffffff";
}

/**
 * Premium "paper" wrapper for client-facing documents (proposals, contracts,
 * invoices): a brand-colored header band with logo/monogram, a generously spaced
 * sheet, and a subtle footer. Colors are forced to print so the saved PDF keeps
 * the full design; the toolbar is hidden on print.
 */
export function DocumentShell({
  brandColor,
  orgName,
  logoUrl,
  docLabel,
  headerRight,
  children,
}: {
  brandColor: string;
  orgName: string;
  logoUrl?: string | null;
  docLabel: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const onBrand = readableText(brandColor);
  const chipBg = onBrand === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)";

  return (
    <div className="min-h-screen bg-zinc-100 py-10 print:bg-white print:py-0">
      <style>{`
        @media print {
          .doc-toolbar { display: none !important; }
          .doc-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; border-radius: 0 !important; }
          @page { margin: 0; }
        }
        .doc-sheet, .doc-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <div className="doc-toolbar mx-auto mb-4 flex max-w-[840px] items-center justify-between px-4">
        <span className="text-sm font-medium text-zinc-500">{docLabel}</span>
        <PrintButton />
      </div>

      <div className="doc-sheet mx-auto max-w-[840px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-zinc-200/60">
        {/* Brand header band */}
        <div className="flex items-center justify-between px-10 py-8" style={{ backgroundColor: brandColor, color: onBrand }}>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-11 w-auto object-contain" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold"
                style={{ backgroundColor: chipBg }}
              >
                {orgName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xl font-semibold tracking-tight">{orgName}</span>
          </div>
          <div className="text-right" style={{ opacity: 0.95 }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">{docLabel}</p>
            {headerRight}
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-10">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-10 py-5 text-xs text-zinc-400">
          <span>{orgName}</span>
          <span>Powered by Leadly.ai</span>
        </div>
      </div>
    </div>
  );
}
