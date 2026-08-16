import "@/validation-config";

import { type } from "arktype";

import { paginationQueryFields } from "@/pagination";
import { Amount, CategoryId, Month } from "@/validation";

const actualsQuerySchema = type({
  ...paginationQueryFields,
  sort: "'month' | 'category' | 'note' | 'amount' = 'month'",
  direction: "'ascending' | 'descending' = 'descending'",
});

const Note = type("string.trim |> string <= 500").configure({
  message: "Note must have 500 characters or less",
});

const actualInputSchema = type({
  categoryId: CategoryId,
  month: Month,
  amount: Amount,
  "note?": Note,
});

export { actualInputSchema, actualsQuerySchema };
