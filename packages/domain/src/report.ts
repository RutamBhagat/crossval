import type { CategoryId } from "./categories.js";

type MonthlyVariance = {
  month: string;
  varianceCents: number;
};

type ReportRow = {
  categoryId: CategoryId;
  month: string;
  planCents: number;
  actualCents: number;
  varianceCents: number;
  variancePercent: number | null;
};

function buildReportCsv(
  rows: ReportRow[],
  categoryNameFor: (categoryId: CategoryId) => string,
) {
  const escapeCsvField = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  const amount = (cents: number) => (cents / 100).toFixed(2);
  const lines = ["Month,Category,Plan,Actual,Variance,Variance %"];

  for (const row of rows) {
    lines.push(
      [
        row.month,
        categoryNameFor(row.categoryId),
        amount(row.planCents),
        amount(row.actualCents),
        amount(row.varianceCents),
        row.variancePercent === null ? "N/A" : row.variancePercent.toFixed(2),
      ]
        .map((value) => escapeCsvField(value))
        .join(","),
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}

export { buildReportCsv };
export type { MonthlyVariance, ReportRow };
