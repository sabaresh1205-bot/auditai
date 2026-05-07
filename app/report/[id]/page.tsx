import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient, getPublicAuditReportById } from "@/lib/supabase/client";
import { buildPublicReportPayload } from "@/lib/report/public";
import { AuditSummaryCard } from "@/components/results/AuditSummaryCard";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { SavingsBreakdown } from "@/components/results/SavingsBreakdown";

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
    const amount = payload.report.annualSavings.toFixed(0);
    const title = `This team could save $${amount}/year on AI tools.`;
    const description = `AuditAI report with deterministic recommendations and ${payload.report.recommendations.length} actions.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Public Audit Report
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Savings and recommendations
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Report ID {row.id} • Generated {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
        >
          Create your own audit
        </Link>
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

