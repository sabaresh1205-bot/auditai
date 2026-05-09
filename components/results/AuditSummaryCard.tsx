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
  const status = monthlySavings > 0 ? "Savings identified" : "Spend looks aligned";

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            At a glance
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{status}</h2>
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
            <div className="text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
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

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Monthly spend
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatMoneyDeterministic(summary.currency, summary.totalMonthlySpend)}
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Annual spend
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatMoneyDeterministic(summary.currency, summary.totalAnnualSpend)}
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-black/30">
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

