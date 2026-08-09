import type { ReportRow } from "@/server/report";


function buildMonthlyVariance(rows: ReportRow[]) {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.month, (totals.get(row.month) ?? 0) + row.varianceCents);
  }

  return Array.from(totals, ([month, varianceCents]) => ({
    month,
    varianceCents,
  })).sort((left, right) => left.month.localeCompare(right.month));
}

export { buildMonthlyVariance };
export type { ReportRow };
