"use client";

import type { Recommendation } from "@/lib/audit/rules";
import type { CurrencyCode } from "@/lib/audit/types";
import { formatMoneyDeterministic } from "@/lib/report/format";

type ToolSavings = {
  tool: string;
  savings: number;
};

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

export function SavingsByToolChart({
  currency,
  recommendations,
}: {
  currency: CurrencyCode;
  recommendations: Recommendation[];
}) {
  const byTool = new Map<string, number>();
  for (const rec of recommendations) {
    if (!Number.isFinite(rec.estimatedSavings) || rec.estimatedSavings <= 0) continue;
    byTool.set(rec.tool, (byTool.get(rec.tool) ?? 0) + rec.estimatedSavings);
  }

  const rows: ToolSavings[] = [...byTool.entries()]
    .map(([tool, savings]) => ({ tool, savings: money(savings) }))
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5);

  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold tracking-tight">Savings by tool</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          No major savings drivers detected.
        </p>
      </section>
    );
  }

  const maxSavings = rows[0]?.savings ?? 1;

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
      aria-label="Savings by tool chart"
    >
      <h2 className="text-lg font-semibold tracking-tight">Savings by tool</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Top estimated monthly savings contributors.
      </p>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const widthPct = Math.max(6, Math.round((row.savings / maxSavings) * 100));
          return (
            <li key={row.tool} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-100">
                  {row.tool}
                </span>
                <span className="shrink-0 text-zinc-700 dark:text-zinc-200">
                  {formatMoneyDeterministic(currency, row.savings)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{ width: `${widthPct}%` }}
                  aria-label={`${row.tool}: ${formatMoneyDeterministic(currency, row.savings)} estimated monthly savings`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
