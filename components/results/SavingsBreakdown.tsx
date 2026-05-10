"use client";

import type { Recommendation } from "@/lib/audit/rules";
import { formatMoneyDeterministic } from "@/lib/report/format";
import type { CurrencyCode } from "@/lib/audit/types";

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

export function SavingsBreakdown({
  currency,
  recommendations,
}: {
  currency: CurrencyCode;
  recommendations: Recommendation[];
}) {
  const positive = recommendations.filter((r) => r.estimatedSavings > 0);
  const sorted = positive.slice().sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  const top = sorted.slice(0, 5);
  const total = money(positive.reduce((sum, r) => sum + r.estimatedSavings, 0));

  if (positive.length === 0) {
    return (
      <section className="print-avoid-break print-compact rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
        <h2 className="text-lg font-semibold tracking-tight">Savings breakdown</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          No material savings surfaced from these inputs—you can still export or share once a link is ready.
        </p>
      </section>
    );
  }

  return (
    <section className="print-avoid-break print-compact rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Savings breakdown</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Largest contributors to estimated monthly savings.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Total monthly savings
          </div>
          <div className="text-lg font-semibold">
            {formatMoneyDeterministic(currency, total)}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {top.map((r) => (
          <div key={`${r.toolId}:${r.type}:${r.recommendedAction}`} className="grid grid-cols-12 gap-3">
            <div className="col-span-7 text-sm font-medium">{r.tool}</div>
            <div className="col-span-5 text-right text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {formatMoneyDeterministic(currency, r.estimatedSavings)}
            </div>
            <div className="col-span-12 h-2 rounded-full bg-zinc-100 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
                style={{
                  width: `${Math.max(6, Math.round((r.estimatedSavings / total) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

