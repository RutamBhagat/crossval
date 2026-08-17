import { t } from "elysia";

import { CategoryId, Month, sortDirection } from "../../schemas/common.js";

const ReportSort = t.UnionEnum(["month", "category", "target"], {
  default: "month",
});
const ReportDirection = sortDirection(1);

const ReportQuery = t.Object({
  start: Month,
  end: Month,
  offset: t.Numeric({ minimum: 0, default: 0 }),
  limit: t.Numeric({ minimum: 1, maximum: 50, default: 10 }),
  sort: ReportSort,
  direction: ReportDirection,
});
const ReportExportQuery = t.Object({
  start: Month,
  end: Month,
  sort: ReportSort,
  direction: ReportDirection,
});
const ReportActualsQuery = t.Object({ categoryId: CategoryId, month: Month });

const ReportRowDto = t.Object({
  categoryId: CategoryId,
  month: Month,
  planCents: t.Integer(),
  actualCents: t.Integer(),
  varianceCents: t.Integer(),
  variancePercent: t.Nullable(t.Number()),
});
const ReportResponse = t.Object({
  reports: t.Array(ReportRowDto),
  monthlyVariance: t.Array(
    t.Object({ month: Month, varianceCents: t.Integer() }),
  ),
  total: t.Integer({ minimum: 0 }),
});
const ReportActualsResponse = t.Object({
  actuals: t.Array(
    t.Object({
      id: t.String(),
      amountCents: t.Integer({ minimum: 0 }),
      note: t.Optional(t.String()),
    }),
  ),
});

export {
  ReportActualsQuery,
  ReportActualsResponse,
  ReportExportQuery,
  ReportQuery,
  ReportResponse,
};
