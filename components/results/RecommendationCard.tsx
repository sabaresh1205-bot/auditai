"use client";

import type { Recommendation } from "@/lib/audit/rules";
import type { CurrencyCode } from "@/lib/audit/types";
import { formatMoneyDeterministic } from "@/lib/report/format";
import { SeverityBadge } from "@/components/results/SeverityBadge";
import { ConfidenceBadge } from "@/components/results/ConfidenceBadge";

export function RecommendationCard({
  currency,
  recommendation,
}: {
  currency: CurrencyCode;
  recommendation: Recommendation;
}) {
  const emphasize = recommendation.estimatedSavings >= 100;

  return (
    <article
      className={`print-avoid-break print-compact rounded-3xl border bg-white p-5 shadow-sm dark:bg-white/5 sm:p-6 ${
        emphasize
          ? "border-zinc-900 ring-1 ring-zinc-900/10 dark:border-white/30 dark:ring-white/10"
          : "border-zinc-200 dark:border-white/10"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Tool</div>
          <div className="mt-1 text-base font-semibold tracking-tight">{recommendation.tool}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            <SeverityBadge severity={recommendation.severity} />
            <ConfidenceBadge confidence={recommendation.confidence} />
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Est. monthly savings
          </div>
          <div
            className={`mt-1 text-lg font-semibold ${
              emphasize ? "text-zinc-900 dark:text-white" : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {formatMoneyDeterministic(currency, recommendation.estimatedSavings)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Recommendation
          </div>
          <div className="mt-1 text-sm font-semibold leading-6">{recommendation.recommendedAction}</div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 p-4 dark:border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Reason
          </div>
          <div className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
            {recommendation.reason}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Current spend
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatMoneyDeterministic(currency, recommendation.currentSpend)}
              {" / month"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Impact
            </div>
            <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">{recommendation.impact}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

