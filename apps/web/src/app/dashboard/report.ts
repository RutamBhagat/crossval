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

function buildReportRows(plans: MonthlyAmount[], actuals: MonthlyAmount[]): ReportRow[] {
  return plans.flatMap((plan) => {
    const matchingActuals = actuals.filter(
      (actual) =>
        actual.categoryId === plan.categoryId && actual.month === plan.month,
    );

    if (matchingActuals.length === 0) {
      return [];
    }

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

export { buildReportRows, filterReportRows };
export type { ReportRow };
