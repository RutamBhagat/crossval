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

function buildReportRows(
  plans: MonthlyPlan[],
  actualTotals: MonthlyActualTotal[],
): ReportRow[] {
  const actualsByPeriod = new Map(
    actualTotals.map((actual) => [
      `${actual.categoryId}:${actual.month}`,
      actual.actualCents,
    ]),
  );

  return plans.map((plan) => {
    const actualCents =
      actualsByPeriod.get(`${plan.categoryId}:${plan.month}`) ?? 0;
    const varianceCents = actualCents - plan.amountCents;

    return {
      categoryId: plan.categoryId,
      month: plan.month,
      planCents: plan.amountCents,
      actualCents,
      varianceCents,
      variancePercent:
        plan.amountCents === 0
          ? null
          : (varianceCents / plan.amountCents) * 100,
    };
  });
}

export { buildMonthlyVariance, buildReportRows };
export type { MonthlyActualTotal, MonthlyPlan, MonthlyVariance, ReportRow };
