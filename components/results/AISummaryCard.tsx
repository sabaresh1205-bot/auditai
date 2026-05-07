"use client";

import { useMemo } from "react";
import type { CurrencyCode } from "@/lib/audit/types";
import { formatMoneyDeterministic } from "@/lib/report/format";

type AISummaryCardProps = {
  currency: CurrencyCode;
  monthlySavings: number;
  annualSavings: number;
  status: "idle" | "loading" | "success" | "error";
  summary: string | null;
  source: "ai" | "fallback" | null;
  errorMessage?: string;
  onRetry: () => void;
};

function SummarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-100 dark:bg-white/10" />
    </div>
  );
}

function sourceLabel(source: "ai" | "fallback") {
  return source === "ai" ? "AI summary" : "Deterministic fallback";
}

export function AISummaryCard({
  currency,
  monthlySavings,
  annualSavings,
  status,
  summary,
  source,
  errorMessage,
  onRetry,
}: AISummaryCardProps) {
  const hasSavings = monthlySavings > 0;

  const wrapperClass = useMemo(() => {
    if (hasSavings) {
      return "border border-emerald-200 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-white/5";
    }
    return "border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5";
  }, [hasSavings]);

  return (
    <section className={`rounded-2xl p-6 ${wrapperClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Executive summary
          </p>
          <h2 className={`mt-1 text-xl font-semibold tracking-tight ${hasSavings ? "text-emerald-900 dark:text-emerald-100" : ""}`}>
            {hasSavings ? "Potential savings, prioritized actions" : "Stack looks optimized"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {formatMoneyDeterministic(currency, monthlySavings)} / month •{" "}
            {formatMoneyDeterministic(currency, annualSavings)} / year
          </p>
        </div>
        {source ? (
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
            {sourceLabel(source)}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        {status === "loading" ? (
          <SummarySkeleton />
        ) : status === "error" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Summary temporarily unavailable.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {errorMessage ?? "Please try again."}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Retry summary
            </button>
          </div>
        ) : summary ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Preparing your summary…
          </p>
        )}
      </div>
    </section>
  );
}

