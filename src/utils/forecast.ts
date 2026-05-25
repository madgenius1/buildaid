import { Transaction } from "@/context/AppContext";

export interface Forecast {
  dailySpendRate: number;
  daysOfData: number;
  daysRemaining: number;
  projectedTotalSpend: number;
  isOverBudget: boolean;
  percentUsed: number;
}

export function computeForecast(
  transactions: Transaction[],
  budget: number,
  totalSpent: number
): Forecast | null {
  const purchaseTxs = transactions.filter((t) => t.type === "purchase");
  if (purchaseTxs.length === 0 || totalSpent === 0) return null;

  const dates = purchaseTxs
    .map((t) => new Date(t.date).getTime())
    .sort((a, b) => a - b);

  const firstDate = dates[0];
  const daysOfData = Math.max(
    1,
    (Date.now() - firstDate) / (1000 * 60 * 60 * 24)
  );

  const dailySpendRate = totalSpent / daysOfData;
  const remainingBudget = budget - totalSpent;

  const daysRemaining =
    dailySpendRate > 0 ? Math.floor(remainingBudget / dailySpendRate) : 999;

  const projectedTotalSpend = budget > 0 ? (totalSpent / budget) * budget * (budget / totalSpent) : totalSpent;

  const percentUsed = budget > 0 ? totalSpent / budget : 0;

  return {
    dailySpendRate,
    daysOfData: Math.floor(daysOfData),
    daysRemaining: Math.max(0, daysRemaining),
    projectedTotalSpend: totalSpent,
    isOverBudget: totalSpent > budget,
    percentUsed,
  };
}

export function formatRate(rate: number): string {
  if (rate >= 1000000) return `KSh ${(rate / 1000000).toFixed(1)}M/day`;
  if (rate >= 1000) return `KSh ${(rate / 1000).toFixed(0)}K/day`;
  return `KSh ${rate.toFixed(0)}/day`;
}

export function formatKshCompact(n: number): string {
  if (n >= 1000000) return `KSh ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `KSh ${(n / 1000).toFixed(0)}K`;
  return `KSh ${n.toFixed(0)}`;
}
