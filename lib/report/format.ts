import type { CurrencyCode } from "@/lib/audit/types";

export function formatMoneyDeterministic(currency: CurrencyCode, amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${n.toFixed(2)}`;
}

