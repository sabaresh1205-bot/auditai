"use client";

import type { Confidence } from "@/lib/audit/rules";

const STYLES: Record<Confidence, string> = {
  high: "bg-zinc-900 text-white dark:bg-white dark:text-black",
  medium: "bg-zinc-100 text-zinc-900 ring-1 ring-inset ring-zinc-200 dark:bg-white/10 dark:text-zinc-100 dark:ring-white/10",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[confidence]}`}
    >
      Confidence: {confidence}
    </span>
  );
}

