import { t } from "elysia";

import { CategoryId, Month, sortDirection } from "../../schemas/common.js";

const ActualsQuery = t.Object({
  offset: t.Numeric({ minimum: 0, default: 0 }),
  limit: t.Numeric({ minimum: 1, maximum: 50, default: 10 }),
  sort: t.UnionEnum(["month", "categoryId", "note", "amountCents"], {
    default: "month",
  }),
  direction: sortDirection(-1),
});

const ActualDto = t.Object({
  id: t.String(),
  categoryId: CategoryId,
  month: Month,
  amountCents: t.Integer({ minimum: 0 }),
  note: t.Optional(t.String()),
});

const ActualInput = t.Object({
  categoryId: CategoryId,
  month: Month,
  amount: t.String({ pattern: "^\\d+(?:\\.\\d{1,2})?$" }),
  note: t.Optional(t.String({ maxLength: 500 })),
});

const ActualsResponse = t.Object({
  actuals: t.Array(ActualDto),
  total: t.Integer({ minimum: 0 }),
});

const ActualSaveResponse = t.Object({ actual: ActualDto });
const ActualImportBody = t.Object({ file: t.File({ maxSize: "1m" }) });
const ActualImportResponse = t.Object({ imported: t.Integer({ minimum: 1 }) });

export {
  ActualImportBody,
  ActualImportResponse,
  ActualInput,
  ActualSaveResponse,
  ActualsQuery,
  ActualsResponse,
};
