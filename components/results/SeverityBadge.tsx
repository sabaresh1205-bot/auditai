"use client";

import type { Severity } from "@/lib/audit/rules";

const STYLES: Record<Severity, string> = {
  high: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20",
  medium:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20",
  low: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10",
};

function capitalizeWord(s: Severity): string {
  return `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[severity]}`}
    >
      {capitalizeWord(severity)} impact
    </span>
  );
}

