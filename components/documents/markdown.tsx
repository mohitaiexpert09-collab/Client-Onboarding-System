import { marked } from "marked";

/**
 * Renders AI/markdown document bodies as clean, styled HTML (headings, lists,
 * bold, rules) — so proposals & contracts read like a real document instead of
 * showing raw "##" and "**" markup. Server component; marked runs server-side.
 */
marked.setOptions({ gfm: true, breaks: true });

export function Markdown({ content, className = "" }: { content: string; className?: string }) {
  const html = marked.parse(content, { async: false }) as string;
  return (
    <div
      className={
        "text-[15px] leading-relaxed text-zinc-700 " +
        "[&_h1]:mb-3 [&_h1]:mt-7 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-900 " +
        "[&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 " +
        "[&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-900 " +
        "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
        "[&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_em]:italic " +
        "[&_hr]:my-6 [&_hr]:border-zinc-200 [&_a]:text-brand-600 [&_a]:underline " +
        "[&_table]:my-3 [&_table]:w-full [&_th]:border-b [&_th]:py-1 [&_th]:text-left [&_td]:py-1 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
