import { type } from "arktype";

import { paginationQueryFields } from "@/pagination";
import { Amount, CategoryId, Month } from "@/validation";

const plansQuerySchema = type({
  ...paginationQueryFields,
  sort: "'month' | 'category' | 'amount' = 'month'",
  direction: "'ascending' | 'descending' = 'descending'",
});

const planInputSchema = type({
  categoryId: CategoryId,
  month: Month,
  amount: Amount,
});

export { planInputSchema, plansQuerySchema };
