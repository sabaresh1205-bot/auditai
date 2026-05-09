"use client";

import Link from "next/link";
import { useState } from "react";
import { generateAuditReport } from "@/lib/audit/engine";
import type {
  AuditInputV1,
  CurrencyCode,
  PlanType,
  PrimaryUseCase,
  ToolId,
  ToolUsageInput,
} from "@/lib/audit/types";
import { DEFAULT_AUDIT_INPUT } from "@/lib/audit/types";
import { formatMoneyDeterministic } from "@/lib/report/format";

const TOOL_OPTIONS: Array<{ id: ToolId; label: string }> = [
  { id: "cursor", label: "Cursor" },
  { id: "github_copilot", label: "GitHub Copilot" },
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
  { id: "perplexity", label: "Perplexity" },
  { id: "openai_api", label: "OpenAI API" },
  { id: "anthropic_api", label: "Anthropic API" },
  { id: "google_ai_studio_api", label: "Google AI Studio API" },
  { id: "other", label: "Other" },
];

const PLAN_OPTIONS: Array<{ id: PlanType; label: string }> = [
  { id: "free", label: "Free" },
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "team", label: "Team" },
  { id: "business", label: "Business" },
  { id: "enterprise", label: "Enterprise" },
  { id: "api_payg", label: "API (pay-as-you-go)" },
];

const USE_CASE_OPTIONS: Array<{ id: PrimaryUseCase; label: string }> = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "research", label: "Research" },
  { id: "data", label: "Data/analytics" },
  { id: "mixed", label: "Mixed" },
];

const CURRENCY_OPTIONS: Array<{ id: CurrencyCode; label: string }> = [
  { id: "USD", label: "USD" },
  { id: "INR", label: "INR" },
  { id: "EUR", label: "EUR" },
  { id: "GBP", label: "GBP" },
  { id: "AUD", label: "AUD" },
  { id: "CAD", label: "CAD" },
  { id: "SGD", label: "SGD" },
];

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function clampMoney(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

function createTool(): ToolUsageInput {
  return { toolId: "cursor", planType: "pro", monthlySpend: 20, seats: 1 };
}

export function EmbedAuditWidget() {
  const [input, setInput] = useState<AuditInputV1>({
    ...DEFAULT_AUDIT_INPUT,
    tools: DEFAULT_AUDIT_INPUT.tools.map((t) => ({ ...t })),
  });
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReturnType<typeof generateAuditReport> | null>(null);

  function updateTool(index: number, patch: Partial<ToolUsageInput>) {
    const tools = input.tools.slice();
    const current = tools[index] ?? createTool();
    const next: ToolUsageInput = { ...current, ...patch };
    if (next.toolId !== "other") next.toolNameOverride = undefined;
    tools[index] = next;
    setInput({ ...input, tools });
  }

  function onRunAudit() {
    if (input.teamSize < 1) {
      setError("Team size must be at least 1.");
      return;
    }
    if (!input.tools.length) {
      setError("Add at least one tool.");
      return;
    }
    if (input.tools.some((t) => t.seats < 1)) {
      setError("Seats must be at least 1 for each tool.");
      return;
    }
    if (input.tools.some((t) => t.monthlySpend < 0)) {
      setError("Monthly spend must be 0 or more.");
      return;
    }

    setError(null);
    setReport(generateAuditReport(input));
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
          AuditAI embed
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Lightweight AI spend audit
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Deterministic local calculation using your inputs only.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Team size</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={input.teamSize < 1 ? "" : String(input.teamSize)}
              onChange={(e) => {
                if (e.target.value === "") {
                  setInput({ ...input, teamSize: 0 });
                  return;
                }
                setInput({ ...input, teamSize: clampInt(Number(e.target.value), 0, 100000) });
              }}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Primary use case</span>
            <select
              value={input.primaryUseCase}
              onChange={(e) => setInput({ ...input, primaryUseCase: e.target.value as PrimaryUseCase })}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
            >
              {USE_CASE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Currency</span>
            <select
              value={input.currency}
              onChange={(e) => setInput({ ...input, currency: e.target.value as CurrencyCode })}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {input.tools.map((tool, index) => (
            <div key={index} className="grid gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-black/25 sm:grid-cols-12">
              <label className="grid gap-1 text-sm sm:col-span-4">
                <span className="font-medium">Tool</span>
                <select
                  value={tool.toolId}
                  onChange={(e) => updateTool(index, { toolId: e.target.value as ToolId })}
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
                >
                  {TOOL_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm sm:col-span-4">
                <span className="font-medium">Plan</span>
                <select
                  value={tool.planType}
                  onChange={(e) => updateTool(index, { planType: e.target.value as PlanType })}
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
                >
                  {PLAN_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Seats</span>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={tool.seats < 1 ? "" : String(tool.seats)}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      updateTool(index, { seats: 0 });
                      return;
                    }
                    updateTool(index, { seats: clampInt(Number(e.target.value), 0, 100000) });
                  }}
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
                />
              </label>

              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Monthly</span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={String(tool.monthlySpend)}
                  onChange={(e) =>
                    updateTool(index, { monthlySpend: clampMoney(Number(e.target.value), 0, 100000000) })
                  }
                  className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-black/20"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInput({ ...input, tools: [...input.tools, createTool()] })}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            Add tool
          </button>
          <button
            type="button"
            onClick={onRunAudit}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Run audit
          </button>
          <Link
            href="/audit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            Open full report in AuditAI
          </Link>
        </div>

        {error ? (
          <p role="status" aria-live="polite" className="mt-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {report ? (
          <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-semibold tracking-tight">Compact deterministic summary</h2>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-black/25">
                <div className="text-zinc-600 dark:text-zinc-300">Monthly savings</div>
                <div className="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">
                  {formatMoneyDeterministic(report.summary.currency, report.monthlySavings)}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-black/25">
                <div className="text-zinc-600 dark:text-zinc-300">Annual savings</div>
                <div className="mt-1 font-semibold">
                  {formatMoneyDeterministic(report.summary.currency, report.annualSavings)}
                </div>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              {report.recommendations.slice(0, 3).map((r) => (
                <li key={`${r.toolId}:${r.type}:${r.recommendedAction}`} className="rounded-lg bg-zinc-50 p-3 dark:bg-black/25">
                  <span className="font-medium">{r.tool}</span>: {r.recommendedAction}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
