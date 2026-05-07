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
  }, [stored, aiRequestNonce]);

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
  const shareUrl =
    stored.persistedReportId && typeof window !== "undefined"
      ? `${window.location.origin}/report/${stored.persistedReportId}`
      : null;

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
          {persistStatus === "saving" ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 text-sm text-zinc-600 dark:text-zinc-300"
            >
              Saving shareable report...
            </p>
          ) : null}
          {persistStatus === "error" ? (
            <p
              role="status"
              aria-live="assertive"
              className="mt-2 text-sm text-red-600 dark:text-red-300"
            >
              {persistMessage}
            </p>
          ) : null}
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

            <ShareExportPanel shareUrl={shareUrl} />
            <LeadCaptureForm
              reportId={stored.persistedReportId ?? null}
              defaultTeamSize={stored.input.teamSize}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

