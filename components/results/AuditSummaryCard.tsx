"use client";

import type { AuditSummary } from "@/lib/audit/engine";
import { formatMoneyDeterministic } from "@/lib/report/format";

export function AuditSummaryCard({
  summary,
  monthlySavings,
  annualSavings,
}: {
  summary: AuditSummary;
  monthlySavings: number;
  annualSavings: number;
}) {
  const status =
    monthlySavings > 0 ? "Potential savings detected" : "Your stack is already optimized";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Audit Summary
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{status}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Team size {summary.teamSize} • Use case {summary.primaryUseCase} •{" "}
            {summary.toolCount} tool(s)
          </p>
        </div>

        <div className="grid gap-3 sm:text-right">
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Monthly savings
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {formatMoneyDeterministic(summary.currency, monthlySavings)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Annual savings
            </div>
            <div className="text-lg font-semibold">
              {formatMoneyDeterministic(summary.currency, annualSavings)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Monthly spend
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatMoneyDeterministic(summary.currency, summary.totalMonthlySpend)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Annual spend
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatMoneyDeterministic(summary.currency, summary.totalAnnualSpend)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Cost per teammate
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatMoneyDeterministic(summary.currency, summary.costPerTeamMember)}
            {" / month"}
          </div>
        </div>
      </div>
    </section>
  );
}

