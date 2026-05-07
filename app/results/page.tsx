"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuditReport } from "@/contexts/AuditReportContext";
import { AuditSummaryCard } from "@/components/results/AuditSummaryCard";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { SavingsBreakdown } from "@/components/results/SavingsBreakdown";
import { ShareExportPanel } from "@/components/results/ShareExportPanel";
import { EmptyStateCard } from "@/components/results/EmptyStateCard";
import { ResultsSkeleton } from "@/components/results/ResultsSkeleton";
import { generatePortfolioInsights } from "@/lib/report/insights";

export default function ResultsPage() {
  const { isHydrated, stored, clear } = useAuditReport();

  const insights = useMemo(() => {
    if (!stored) return [];
    return generatePortfolioInsights(stored.input, stored.report);
  }, [stored]);

  if (!isHydrated) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-14">
        <ResultsSkeleton />
      </main>
    );
  }

  if (!stored) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-14">
        <EmptyStateCard
          title="No audit report found"
          description="Generate an audit first to see recommendations and savings."
          ctaHref="/audit"
          ctaLabel="Go to audit"
        />
      </main>
    );
  }

  const { report } = stored;
  const currency = report.summary.currency;
  const recommendations = report.recommendations;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Audit results
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Savings and recommendations
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Deterministic, rule-based audit. Generated at{" "}
            <span className="font-medium">{new Date(stored.generatedAtIso).toLocaleString()}</span>
            .
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/audit"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
          >
            Edit inputs
          </Link>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Clear report
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <AuditSummaryCard
          summary={report.summary}
          monthlySavings={report.monthlySavings}
          annualSavings={report.annualSavings}
        />

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Recommendations</h2>

            {recommendations.length === 0 ? (
              <EmptyStateCard
                title="No recommendations"
                description="We couldn’t generate any recommendations from the current inputs."
                ctaHref="/audit"
                ctaLabel="Update audit inputs"
              />
            ) : (
              <div className="space-y-4">
                {recommendations.map((r) => (
                  <RecommendationCard
                    key={`${r.toolId}:${r.type}:${r.recommendedAction}`}
                    currency={currency}
                    recommendation={r}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <SavingsBreakdown currency={currency} recommendations={recommendations} />

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Portfolio insights</h2>
              <div className="mt-4 space-y-4">
                {insights.map((i) => (
                  <div key={i.id} className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
                    <div className="text-sm font-semibold">{i.title}</div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {i.detail}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <ShareExportPanel />
          </aside>
        </div>
      </div>
    </main>
  );
}

