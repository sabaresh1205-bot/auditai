import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient, getPublicAuditReportById } from "@/lib/supabase/client";
import { buildPublicReportPayload } from "@/lib/report/public";
import { AuditSummaryCard } from "@/components/results/AuditSummaryCard";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { SavingsBreakdown } from "@/components/results/SavingsBreakdown";
import { BenchmarkCard } from "@/components/results/BenchmarkCard";
import { formatMoneyDeterministic } from "@/lib/report/format";
import { getPublicReportPageUrl } from "@/lib/seo/publicSiteUrl";

type Params = { id: string };

async function loadPublicReport(id: string) {
  const client = createSupabaseServerClient();
  const row = await getPublicAuditReportById(client, id);
  if (!row) return null;
  const payload = buildPublicReportPayload(row.input_data, row.report_data);
  if (!payload) return null;
  return { row, payload };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const loaded = await loadPublicReport(id);
    if (!loaded) {
      return { title: "Audit report not found | AuditAI" };
    }
    const { payload } = loaded;
    const { report } = payload;
    const monthlyLabel = formatMoneyDeterministic(report.summary.currency, report.monthlySavings);
    const annualLabel = formatMoneyDeterministic(report.summary.currency, report.annualSavings);
    const title = `AuditAI Report — Potential savings: ${monthlyLabel}/month`;
    const description = `Deterministic AI spend audit: ${monthlyLabel}/month (${annualLabel}/year) estimated savings, ${report.recommendations.length} recommendation(s). Shareable AuditAI report.`;
    const canonicalUrl = getPublicReportPageUrl(id);

    return {
      title: { absolute: title },
      description,
      ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
      openGraph: {
        title,
        description,
        type: "article",
        siteName: "AuditAI",
        ...(canonicalUrl ? { url: canonicalUrl } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: "Audit report | AuditAI" };
  }
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const loaded = await loadPublicReport(id);
  if (!loaded) notFound();

  const { row, payload } = loaded;
  const { report, insights } = payload;

  return (
    <main className="print-document mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Shared savings report
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Savings & recommendations
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Report ID {row.id} · Generated {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <Link
          href="/audit"
          className="no-print inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
        >
          Run free audit
        </Link>
      </div>

      <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-500/30 dark:bg-white/5 sm:p-8">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Potential savings</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Monthly savings</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {formatMoneyDeterministic(report.summary.currency, report.monthlySavings)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Annual savings</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatMoneyDeterministic(report.summary.currency, report.annualSavings)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Status</p>
            <p className="mt-1 text-base font-medium text-zinc-800 dark:text-zinc-200">
              {report.monthlySavings > 0 ? "Savings identified" : "Spend looks aligned"}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <BenchmarkCard
          totalMonthlySpend={report.summary.totalMonthlySpend}
          teamSize={report.summary.teamSize}
          currency={report.summary.currency}
        />
      </div>

      <div className="mt-6 space-y-6">
        <AuditSummaryCard
          summary={report.summary}
          monthlySavings={report.monthlySavings}
          annualSavings={report.annualSavings}
        />
        <div className="print-flatten-grid grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Deterministic recommendations</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Ranked by estimated monthly impact. Figures are produced by deterministic audit rules only.
              </p>
            </div>
            {report.recommendations.map((r) => (
              <RecommendationCard
                key={`${r.toolId}:${r.type}:${r.recommendedAction}`}
                currency={report.summary.currency}
                recommendation={r}
              />
            ))}
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <SavingsBreakdown
              currency={report.summary.currency}
              recommendations={report.recommendations}
            />
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
          </aside>
        </div>
      </div>
    </main>
  );
}

