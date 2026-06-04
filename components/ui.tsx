import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Minimal, refined UI primitives (Tailwind). Linear/Stripe-style craft. */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 " +
  focusRing;

const btnVariant = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-500 active:bg-brand-700",
  secondary:
    "border border-zinc-200 bg-white text-zinc-800 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
} as const;

const btnSize = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariant;
  size?: keyof typeof btnSize;
}) {
  return (
    <button className={cn(btnBase, btnVariant[variant], btnSize[size], className)} {...props} />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: keyof typeof btnSize;
}) {
  return (
    <Link className={cn(btnBase, btnVariant[variant], btnSize[size], className)} {...props} />
  );
}

const fieldBase =
  "w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 shadow-xs outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-brand-500";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "px-3 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "h-10 px-3", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  color = "zinc",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  color?: "zinc" | "green" | "amber" | "indigo" | "brand" | "red" | "blue";
}) {
  const colors: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    green: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-900",
    amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900",
    indigo: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900",
    brand: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-900",
    red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-900",
    blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        colors[color],
        className
      )}
      {...props}
    />
  );
}
