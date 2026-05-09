"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuditReport } from "@/contexts/AuditReportContext";
import { AuditSummaryCard } from "@/components/results/AuditSummaryCard";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { SavingsBreakdown } from "@/components/results/SavingsBreakdown";
import { ShareExportPanel } from "@/components/results/ShareExportPanel";
import { EmptyStateCard } from "@/components/results/EmptyStateCard";
import { ResultsSkeleton } from "@/components/results/ResultsSkeleton";
import { generatePortfolioInsights } from "@/lib/report/insights";
import { LeadCaptureForm } from "@/components/lead-capture/LeadCaptureForm";
import {
  buildPersistKey,
  getPersistedIdByKey,
  setPersistedIdByKey,
} from "@/lib/report/persistence";
import { AISummaryCard } from "@/components/results/AISummaryCard";
import { fnv1a32 } from "@/lib/utils/hash";
import {
  CREDEX_CONSULTATION_URL,
  CREDEX_CTA_MIN_MONTHLY_SAVINGS,
} from "@/lib/config/credexConsultation";
import { formatMoneyDeterministic } from "@/lib/report/format";

export default function ResultsPage() {
  const { isHydrated, stored, setStored, clear } = useAuditReport();
  const [persistStatus, setPersistStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [persistMessage, setPersistMessage] = useState("");
  const persistAttemptedForKeyRef = useRef<string | null>(null);

  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const aiAttemptedForKeyRef = useRef<string | null>(null);
  const [aiRequestNonce, setAiRequestNonce] = useState(0);

  const insights = useMemo(() => {
    if (!stored) return [];
    return generatePortfolioInsights(stored.input, stored.report);
  }, [stored]);

  useEffect(() => {
    async function persistReportIfNeeded() {
      if (!stored) return;

      if (stored.persistedReportId) {
        setPersistStatus("saved");
        return;
      }

      const persistKey = buildPersistKey(stored);
      const alreadyPersisted = getPersistedIdByKey(persistKey);
      if (alreadyPersisted) {
        setStored({ ...stored, persistedReportId: alreadyPersisted });
        setPersistStatus("saved");
        return;
      }

      // Prevent duplicate POSTs from rerenders / StrictMode double-effect.
      if (persistAttemptedForKeyRef.current === persistKey) return;
      persistAttemptedForKeyRef.current = persistKey;

      setPersistStatus("saving");
      setPersistMessage("");
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: stored.input, report: stored.report }),
        });
        const data = (await res.json()) as {
          id?: string;
          error?: { message?: string } | string;
        };
        if (!res.ok || !data.id) {
          const errMsg =
            typeof data.error === "string"
              ? data.error
              : data.error?.message || "Failed to save report.";
          throw new Error(errMsg);
        }
        setPersistedIdByKey(persistKey, data.id);
        setStored({ ...stored, persistedReportId: data.id });
        setPersistStatus("saved");
      } catch (error) {
        persistAttemptedForKeyRef.current = null;
        setPersistStatus("error");
        setPersistMessage(error instanceof Error ? error.message : "Failed to save report.");
      }
    }
    void persistReportIfNeeded();
  }, [stored, setStored]);

  useEffect(() => {
    async function ensureAiSummary() {
      if (!stored) return;
      if (typeof window === "undefined") return;

      const persistKey = buildPersistKey(stored);
      const shortKey = fnv1a32(persistKey);
      const localKey = `auditai:aiSummary:${shortKey}`;

      const cachedRaw = window.localStorage.getItem(localKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as { summary?: string; source?: "ai" | "fallback" };
          if (cached.summary) {
            setAiText(cached.summary);
            setAiSource(cached.source ?? "fallback");
            setAiStatus("success");
            return;
          }
        } catch {
          // ignore cache parse errors
        }
      }

      if (aiAttemptedForKeyRef.current === localKey) return;
      aiAttemptedForKeyRef.current = localKey;

      setAiStatus("loading");
      setAiErrorMessage(null);

      // Payload is deterministic: derived from the stored audit report.
      const payload = {
        version: 1,
        currency: stored.input.currency,
        teamSize: stored.input.teamSize,
        primaryUseCase: stored.input.primaryUseCase,
        tools: stored.input.tools,
      };

      const report = {
        summary: stored.report.summary,
        recommendations: stored.report.recommendations,
        monthlySavings: stored.report.monthlySavings,
        annualSavings: stored.report.annualSavings,
      };

      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "openai",
            payload: { input: payload, report },
          }),
        });

        const data = (await res.json()) as
          | { ok: true; summary: string; source: "ai" | "fallback" }
          | { ok: false; error: { message?: string } };

        if (!res.ok || !("ok" in data) || !data.ok || !data.summary) {
          const msg = !res.ok
            ? data && "error" in data && data.error?.message
              ? data.error.message
              : "Failed to generate summary."
            : "Failed to generate summary.";
          throw new Error(msg);
        }

        setAiText(data.summary);
        setAiSource(data.source);
        setAiStatus("success");

        window.localStorage.setItem(localKey, JSON.stringify({ summary: data.summary, source: data.source }));
      } catch (err) {
        setAiStatus("error");
        setAiErrorMessage(err instanceof Error ? err.message : "Summary failed.");
        aiAttemptedForKeyRef.current = null;
      }
    }

    void ensureAiSummary();
  }, [stored, aiRequestNonce]);

  if (!isHydrated) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-12">
        <ResultsSkeleton />
      </main>
    );
  }

  if (!stored) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-12">
        <EmptyStateCard
          title="No report yet"
          description="Run a free audit to see deterministic recommendations and estimated savings."
          ctaHref="/audit"
          ctaLabel="Run free audit"
        />
      </main>
    );
  }

  const { report } = stored;
  const currency = report.summary.currency;
  const recommendations = report.recommendations;
  const allRecommendationsNoChange =
    recommendations.length > 0 &&
    recommendations.every((r) => r.type === "NO_CHANGE");
  const isLowSavings = report.monthlySavings < 100 || allRecommendationsNoChange;
  const shareUrl =
    stored.persistedReportId && typeof window !== "undefined"
      ? `${window.location.origin}/report/${stored.persistedReportId}`
      : null;

  return (
    <main className="print-document mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Your savings report
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Savings & recommendations
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Deterministic audit · Generated{" "}
            <span className="font-medium">{new Date(stored.generatedAtIso).toLocaleString()}</span>
          </p>
          {stored.persistedReportId ? (
            <p className="print-only mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Report ID: {stored.persistedReportId}
            </p>
          ) : null}
          {persistStatus === "saving" ? (
            <p
              role="status"
              aria-live="polite"
              className="no-print mt-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              Saving shareable link…
            </p>
          ) : null}
          {persistStatus === "error" ? (
            <p
              role="status"
              aria-live="assertive"
              className="no-print mt-2 text-sm text-red-600 dark:text-red-300"
            >
              {persistMessage}
            </p>
          ) : null}
        </div>

        <div className="no-print flex flex-wrap gap-3">
          <Link
            href="/audit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
          >
            Edit audit
          </Link>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Clear report
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-500/30 dark:bg-white/5 sm:p-8">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Potential savings</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Monthly savings</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {report.summary.currency} {report.monthlySavings.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">Annual savings</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.currency} {report.annualSavings.toFixed(2)}
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

      {report.monthlySavings >= CREDEX_CTA_MIN_MONTHLY_SAVINGS ? (
        <aside className="no-print mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            High-savings organizations may benefit from a deeper tooling and credit optimization review.
          </p>
          <a
            href={CREDEX_CONSULTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Book a Credex Consultation
          </a>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Opens scheduling in a new tab · Based on estimated{" "}
            {formatMoneyDeterministic(currency, report.monthlySavings)} / month
          </p>
        </aside>
      ) : null}

      <div className="print-report-body mt-6 flex flex-col gap-6">
        <div className="print-o-audit">
          <AuditSummaryCard
            summary={report.summary}
            monthlySavings={report.monthlySavings}
            annualSavings={report.annualSavings}
          />
        </div>

        <div className="print-o-ai">
          <AISummaryCard
            currency={report.summary.currency}
            monthlySavings={report.monthlySavings}
            annualSavings={report.annualSavings}
            status={aiStatus}
            summary={aiText}
            source={aiSource}
            errorMessage={aiErrorMessage ?? undefined}
            onRetry={() => {
              aiAttemptedForKeyRef.current = null;
              setAiStatus("idle");
              setAiText(null);
              setAiSource(null);
              setAiErrorMessage(null);
              setAiRequestNonce((n) => n + 1);
            }}
          />
        </div>

        <div className="print-o-grid print-flatten-grid grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Deterministic recommendations</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                Ranked by estimated monthly impact. Amounts below come from deterministic rules—not from the optional AI summary.
              </p>
            </div>

            {recommendations.length === 0 ? (
              <EmptyStateCard
                title="No recommendations"
                description="We didn’t surface recommendations from these inputs—try adjusting tools, seats, or spend."
                ctaHref="/audit"
                ctaLabel="Edit inputs"
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

            <ShareExportPanel shareUrl={shareUrl} />
            {isLowSavings ? (
              <div className="no-print rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
                <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Your AI tooling spend already looks well optimized.
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  We didn’t find major deterministic savings opportunities based on your current stack.
                  Leave your email and we’ll notify you if new pricing changes or optimization
                  opportunities apply in the future.
                </p>
              </div>
            ) : null}
            <LeadCaptureForm
              reportId={stored.persistedReportId ?? null}
              defaultTeamSize={stored.input.teamSize}
              optimizedStack={isLowSavings}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

