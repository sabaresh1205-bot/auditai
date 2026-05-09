import type { CurrencyCode } from "@/lib/audit/types";
import { formatMoneyDeterministic } from "@/lib/report/format";

export type BenchmarkStatus = "BELOW_AVERAGE" | "AROUND_AVERAGE" | "ABOVE_AVERAGE";

export type BenchmarkBucket = {
  min: number;
  max: number;
  avgSpendPerDeveloper: number;
};

const BENCHMARKS: BenchmarkBucket[] = [
  { min: 1, max: 5, avgSpendPerDeveloper: 45 },
  { min: 6, max: 20, avgSpendPerDeveloper: 65 },
  { min: 21, max: 50, avgSpendPerDeveloper: 90 },
  { min: 51, max: 200, avgSpendPerDeveloper: 120 },
];

const AROUND_THRESHOLD = 0.15;

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

function findBenchmarkBucket(teamSize: number): BenchmarkBucket {
  const safeTeamSize = Math.max(1, Math.trunc(Number.isFinite(teamSize) ? teamSize : 1));
  const hit = BENCHMARKS.find((b) => safeTeamSize >= b.min && safeTeamSize <= b.max);
  if (hit) return hit;
  if (safeTeamSize > BENCHMARKS[BENCHMARKS.length - 1].max) {
    return BENCHMARKS[BENCHMARKS.length - 1];
  }
  return BENCHMARKS[0];
}

export type BenchmarkInsight = {
  status: BenchmarkStatus;
  bucket: BenchmarkBucket;
  actualSpendPerDeveloper: number;
  benchmarkSpendPerDeveloper: number;
  explanation: string;
  note: string;
};

export function generateBenchmarkInsight({
  totalMonthlySpend,
  teamSize,
  currency,
}: {
  totalMonthlySpend: number;
  teamSize: number;
  currency: CurrencyCode;
}): BenchmarkInsight {
  const bucket = findBenchmarkBucket(teamSize);
  const safeTeamSize = Math.max(1, Math.trunc(Number.isFinite(teamSize) ? teamSize : 1));
  const actualSpendPerDeveloper = money(totalMonthlySpend / safeTeamSize);
  const benchmarkSpendPerDeveloper = bucket.avgSpendPerDeveloper;

  const ratio =
    benchmarkSpendPerDeveloper > 0 ? actualSpendPerDeveloper / benchmarkSpendPerDeveloper : 1;
  const lowerBound = 1 - AROUND_THRESHOLD;
  const upperBound = 1 + AROUND_THRESHOLD;

  const status: BenchmarkStatus =
    ratio < lowerBound ? "BELOW_AVERAGE" : ratio > upperBound ? "ABOVE_AVERAGE" : "AROUND_AVERAGE";

  const actualLabel = formatMoneyDeterministic(currency, actualSpendPerDeveloper);
  const benchmarkLabel = formatMoneyDeterministic(currency, benchmarkSpendPerDeveloper);
  const rangeLabel = `${bucket.min}-${bucket.max}`;

  const explanation =
    status === "BELOW_AVERAGE"
      ? `Based on AuditAI's internal benchmark ranges for teams of similar size (${rangeLabel}), your current AI spend per developer is below the reference average (${actualLabel} vs ${benchmarkLabel}).`
      : status === "ABOVE_AVERAGE"
        ? `Based on AuditAI's internal benchmark ranges for teams of similar size (${rangeLabel}), your current AI spend per developer is above the reference average (${actualLabel} vs ${benchmarkLabel}).`
        : `Based on AuditAI's internal benchmark ranges for teams of similar size (${rangeLabel}), your current AI spend per developer is around the reference average (${actualLabel} vs ${benchmarkLabel}).`;

  return {
    status,
    bucket,
    actualSpendPerDeveloper,
    benchmarkSpendPerDeveloper,
    explanation,
    note: "Benchmarks are deterministic internal reference ranges, not live market pricing data.",
  };
}
