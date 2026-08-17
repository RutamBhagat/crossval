import { t } from "elysia";

import { CategoryId, Month, sortDirection } from "../../schemas/common.js";

const PlansQuery = t.Object({
  offset: t.Numeric({ minimum: 0, default: 0 }),
  limit: t.Numeric({ minimum: 1, maximum: 50, default: 10 }),
  sort: t.UnionEnum(["month", "categoryId", "amountCents"], {
    default: "month",
  }),
  direction: sortDirection(-1),
});

const PlanDto = t.Object({
  id: t.String(),
  categoryId: CategoryId,
  month: Month,
  amountCents: t.Integer({ minimum: 0 }),
});

const PlanInput = t.Object({
  categoryId: CategoryId,
  month: Month,
  amount: t.Integer({
    minimum: 0,
    maximum: Math.floor(Number.MAX_SAFE_INTEGER / 100),
  }),
});

const PlansListResponse = t.Object({
  plans: t.Array(PlanDto),
  total: t.Integer({ minimum: 0 }),
});

const PlanSaveResponse = t.Object({ plan: PlanDto });

export { PlanInput, PlanSaveResponse, PlansListResponse, PlansQuery };
