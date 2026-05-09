"use client";

import type { CurrencyCode } from "@/lib/audit/types";
import {
  generateBenchmarkInsight,
  type BenchmarkInsight,
  type BenchmarkStatus,
} from "@/lib/report/benchmarks";
import { formatMoneyDeterministic } from "@/lib/report/format";

function statusLabel(status: BenchmarkStatus): string {
  if (status === "ABOVE_AVERAGE") return "Above reference";
  if (status === "BELOW_AVERAGE") return "Below reference";
  return "Around reference";
}

function statusClasses(status: BenchmarkStatus): string {
  if (status === "ABOVE_AVERAGE") {
    return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20";
  }
  if (status === "BELOW_AVERAGE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20";
  }
  return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10";
}

export function BenchmarkCard({
  totalMonthlySpend,
  teamSize,
  currency,
}: {
  totalMonthlySpend: number;
  teamSize: number;
  currency: CurrencyCode;
}) {
  const insight: BenchmarkInsight = generateBenchmarkInsight({
    totalMonthlySpend,
    teamSize,
    currency,
  });

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Benchmark mode</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Spend per developer benchmark
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(insight.status)}`}
          aria-label={`Benchmark status: ${statusLabel(insight.status)}`}
        >
          {statusLabel(insight.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Your spend per developer</div>
          <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoneyDeterministic(currency, insight.actualSpendPerDeveloper)} / month
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Internal reference average ({insight.bucket.min}-{insight.bucket.max} seats)
          </div>
          <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoneyDeterministic(currency, insight.benchmarkSpendPerDeveloper)} / month
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-200">{insight.explanation}</p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{insight.note}</p>
    </section>
  );
}
