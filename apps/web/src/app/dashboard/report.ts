type MonthlyAmount = {
  categoryId: string;
  month: string;
  amountCents: number;
};

type ReportRow = {
  categoryId: string;
  month: string;
  planCents: number;
  actualCents: number;
  varianceCents: number;
  variancePercent: number | null;
};

function filterReportRows(rows: ReportRow[], startMonth: string, endMonth: string) {
  return rows.filter((row) => row.month >= startMonth && row.month <= endMonth);
}

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

function buildReportRows(plans: MonthlyAmount[], actuals: MonthlyAmount[]): ReportRow[] {
  return plans.flatMap((plan) => {
    const matchingActuals = actuals.filter(
      (actual) =>
        actual.categoryId === plan.categoryId && actual.month === plan.month,
    );

    const actualCents = matchingActuals.reduce(
      (total, actual) => total + actual.amountCents,
      0,
    );
    const varianceCents = actualCents - plan.amountCents;

    return [
      {
        categoryId: plan.categoryId,
        month: plan.month,
        planCents: plan.amountCents,
        actualCents,
        varianceCents,
        variancePercent:
          plan.amountCents === 0
            ? null
            : (varianceCents / plan.amountCents) * 100,
      },
    ];
  });
}

export { buildMonthlyVariance, buildReportRows, filterReportRows };
export type { ReportRow };
