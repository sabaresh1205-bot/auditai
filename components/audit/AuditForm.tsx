"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AuditInputV1,
  CurrencyCode,
  PlanType,
  PrimaryUseCase,
  ToolId,
  ToolUsageInput,
} from "@/lib/audit/types";
import { DEFAULT_AUDIT_INPUT } from "@/lib/audit/types";
import { generateAuditReport } from "@/lib/audit/engine";
import { useLocalStorageJson } from "@/lib/storage/useLocalStorageJson";
import { useAuditReport } from "@/contexts/AuditReportContext";
import { formatMoneyDeterministic } from "@/lib/report/format";

const STORAGE_KEY = "auditai:auditInput:v1";

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

const CURRENCY_OPTIONS = [
  { id: "USD", label: "USD" },
  { id: "INR", label: "INR" },
  { id: "EUR", label: "EUR" },
  { id: "GBP", label: "GBP" },
  { id: "AUD", label: "AUD" },
  { id: "CAD", label: "CAD" },
  { id: "SGD", label: "SGD" },
] as const;

type FieldErrors = Partial<{
  teamSize: string;
  tools: Array<
    Partial<{
      toolId: string;
      toolNameOverride: string;
      planType: string;
      monthlySpend: string;
      seats: string;
    }>
  >;
}>;

function createEmptyTool(): ToolUsageInput {
  return { toolId: "cursor", planType: "pro", monthlySpend: 0, seats: 1 };
}

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function clampMoney(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

function validate(input: AuditInputV1): FieldErrors {
  const errors: FieldErrors = {};

  if (!Number.isFinite(input.teamSize) || input.teamSize < 1) {
    errors.teamSize = "Team size must be at least 1.";
  }

  if (!input.tools.length) {
    errors.tools = [{ toolId: "Add at least one tool." }];
    return errors;
  }

  errors.tools = input.tools.map((t) => {
    const e: NonNullable<FieldErrors["tools"]>[number] = {};

    if (t.toolId === "other") {
      if (!t.toolNameOverride || t.toolNameOverride.trim().length < 2) {
        e.toolNameOverride = "Please enter the tool name.";
      }
    }

    if (!Number.isFinite(t.seats) || t.seats < 1) {
      e.seats = "Seats must be at least 1.";
    }

    if (!Number.isFinite(t.monthlySpend) || t.monthlySpend < 0) {
      e.monthlySpend = "Monthly spend must be 0 or more.";
    }

    return e;
  });

  if (errors.tools.every((t) => Object.keys(t).length === 0)) {
    delete errors.tools;
  }

  return errors;
}

export function AuditForm() {
  const router = useRouter();
  const { setStored } = useAuditReport();
  const { value: input, setValue: setInput, clearValue } = useLocalStorageJson<AuditInputV1>(
    STORAGE_KEY,
    DEFAULT_AUDIT_INPUT
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const monthlyTotal = useMemo(() => {
    return input.tools.reduce((sum, t) => sum + (Number.isFinite(t.monthlySpend) ? t.monthlySpend : 0), 0);
  }, [input.tools]);

  function updateToolSafe(idx: number, patch: Partial<ToolUsageInput>) {
    // For add/remove operations where index might not exist yet.
    const nextTools = input.tools.slice();
    const current = nextTools[idx] ?? createEmptyTool();
    const next: ToolUsageInput = { ...current, ...patch };
    if (next.toolId !== "other") next.toolNameOverride = undefined;
    nextTools[idx] = next;
    setInput({ ...input, tools: nextTools });
  }

  function removeTool(idx: number) {
    setInput({ ...input, tools: input.tools.filter((_, i) => i !== idx) });
  }

  function addTool() {
    setInput({ ...input, tools: [...input.tools, createEmptyTool()] });
  }

  function reset() {
    clearValue();
    setErrors({});
    setInput(DEFAULT_AUDIT_INPUT);
  }

  async function onGenerateAudit() {
    const nextErrors = validate(input);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsGenerating(true);
    try {
      const report = generateAuditReport(input);
      setStored({
        version: 1,
        input,
        report,
        generatedAtIso: new Date().toISOString(),
      });
      router.push("/results");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold tracking-tight">Company</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Team size</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
              value={input.teamSize <= 0 ? "" : String(input.teamSize)}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                if (e.target.value === "") {
                  setInput({ ...input, teamSize: 0 });
                  return;
                }
                const n = clampInt(Number(e.target.value), 0, 100000);
                setInput({ ...input, teamSize: n });
              }}
            />
            {errors.teamSize ? (
              <span className="text-xs text-red-600 dark:text-red-400">{errors.teamSize}</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Primary use case</span>
            <select
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
              value={input.primaryUseCase}
              onChange={(e) =>
                setInput({
                  ...input,
                  primaryUseCase: e.target.value as PrimaryUseCase,
                })
              }
            >
              {USE_CASE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Currency</span>
            <select
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
              value={input.currency}
              onChange={(e) =>
                setInput({
                  ...input,
                  currency: e.target.value as CurrencyCode,
                })
              }
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">AI tools</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Add each tool you pay for. We’ll analyze redundancy, plan fit, cost-per-seat, and credits later.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={addTool}
          >
            Add tool
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {input.tools.map((tool, idx) => {
            const toolErrors = errors.tools?.[idx];
            const showOtherName = tool.toolId === "other";

            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
              >
                <div className="grid gap-4 md:grid-cols-12 md:items-end">
                  <label className="grid gap-2 md:col-span-3">
                    <span className="text-sm font-medium">Tool</span>
                    <select
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
                      value={tool.toolId}
                      onChange={(e) =>
                        updateToolSafe(idx, { toolId: e.target.value as ToolId })
                      }
                    >
                      {TOOL_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {toolErrors?.toolId ? (
                      <span className="text-xs text-red-600 dark:text-red-400">{toolErrors.toolId}</span>
                    ) : null}
                  </label>

                  {showOtherName ? (
                    <label className="grid gap-2 md:col-span-3">
                      <span className="text-sm font-medium">Tool name</span>
                      <input
                        className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
                        value={tool.toolNameOverride ?? ""}
                        onChange={(e) =>
                          updateToolSafe(idx, { toolNameOverride: e.target.value })
                        }
                        placeholder="e.g., Midjourney"
                      />
                      {toolErrors?.toolNameOverride ? (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {toolErrors.toolNameOverride}
                        </span>
                      ) : null}
                    </label>
                  ) : (
                    <div className="hidden md:col-span-3 md:block" />
                  )}

                  <label className="grid gap-2 md:col-span-3">
                    <span className="text-sm font-medium">Plan type</span>
                    <select
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
                      value={tool.planType}
                      onChange={(e) =>
                        updateToolSafe(idx, { planType: e.target.value as PlanType })
                      }
                    >
                      {PLAN_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {toolErrors?.planType ? (
                      <span className="text-xs text-red-600 dark:text-red-400">{toolErrors.planType}</span>
                    ) : null}
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-medium">Seats</span>
                    <input
                      inputMode="numeric"
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
                      value={String(tool.seats)}
                      onChange={(e) =>
                        updateToolSafe(idx, {
                          seats: clampInt(Number(e.target.value), 1, 100000),
                        })
                      }
                    />
                    {toolErrors?.seats ? (
                      <span className="text-xs text-red-600 dark:text-red-400">{toolErrors.seats}</span>
                    ) : null}
                  </label>

                  <label className="grid gap-2 md:col-span-3">
                    <span className="text-sm font-medium">Monthly spend</span>
                    <input
                      inputMode="decimal"
                      className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-white/15 dark:bg-black/20"
                      value={String(tool.monthlySpend)}
                      onChange={(e) =>
                        updateToolSafe(idx, {
                          monthlySpend: clampMoney(
                            Number(e.target.value),
                            0,
                            100000000
                          ),
                        })
                      }
                    />
                    {toolErrors?.monthlySpend ? (
                      <span className="text-xs text-red-600 dark:text-red-400">{toolErrors.monthlySpend}</span>
                    ) : null}
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    {formatMoneyDeterministic(input.currency, tool.monthlySpend)} / month
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
                    onClick={() => removeTool(idx)}
                    disabled={input.tools.length <= 1}
                    aria-disabled={input.tools.length <= 1}
                    title={input.tools.length <= 1 ? "At least one tool is required" : "Remove tool"}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Monthly total:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {formatMoneyDeterministic(input.currency, monthlyTotal)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium hover:bg-zinc-50 dark:border-white/15 dark:hover:bg-white/5"
              onClick={reset}
            >
              Reset
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              onClick={onGenerateAudit}
              disabled={isGenerating}
              aria-disabled={isGenerating}
            >
              {isGenerating ? "Generating…" : "Generate audit"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

