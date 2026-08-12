type MonthlyPlan = {
  categoryId: string;
  month: string;
  amountCents: number;
};

type MonthlyActualTotal = {
  categoryId: string;
  month: string;
  actualCents: number;
};

type MonthlyVariance = {
  month: string;
  varianceCents: number;
};

type ReportRow = {
  categoryId: string;
  month: string;
  planCents: number;
  actualCents: number;
  varianceCents: number;
  variancePercent: number | null;
};

function buildMonthlyVariance(rows: ReportRow[]): MonthlyVariance[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(row.month, (totals.get(row.month) ?? 0) + row.varianceCents);
  }

  return Array.from(totals, ([month, varianceCents]) => ({
    month,
    varianceCents,
  })).sort((left, right) => left.month.localeCompare(right.month));
}

function buildReportCsv(
  rows: ReportRow[],
  categoryNameFor: (categoryId: string) => string,
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

function buildReportRows(
  plans: MonthlyPlan[],
  actualTotals: MonthlyActualTotal[],
): ReportRow[] {
  const periods = new Map<
    string,
    Pick<ReportRow, "categoryId" | "month" | "planCents" | "actualCents">
  >();

  for (const plan of plans) {
    periods.set(`${plan.categoryId}:${plan.month}`, {
      categoryId: plan.categoryId,
      month: plan.month,
      planCents: plan.amountCents,
      actualCents: 0,
    });
  }

  for (const actual of actualTotals) {
    const key = `${actual.categoryId}:${actual.month}`;
    const period = periods.get(key);

    periods.set(key, {
      categoryId: actual.categoryId,
      month: actual.month,
      planCents: period?.planCents ?? 0,
      actualCents: actual.actualCents,
    });
  }

  return Array.from(periods.values(), (period) => {
    const varianceCents = period.actualCents - period.planCents;

    return {
      ...period,
      varianceCents,
      variancePercent:
        period.planCents === 0
          ? null
          : (varianceCents / period.planCents) * 100,
    };
  });
}

export { buildMonthlyVariance, buildReportCsv, buildReportRows };
export type { MonthlyActualTotal, MonthlyPlan, MonthlyVariance, ReportRow };
