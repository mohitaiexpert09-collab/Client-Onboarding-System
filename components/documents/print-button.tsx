"use client";

/**
 * "Download PDF" button. Uses the browser's native print-to-PDF, which produces
 * a clean, reliable PDF on every platform with zero server dependencies. The
 * print stylesheet (see document pages) hides everything except the document.
 */
export function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      ⬇ {label}
    </button>
  );
}
