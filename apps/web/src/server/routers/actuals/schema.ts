import { z } from "zod";

import { categories } from "@/lib/categories";
import { paginationQuerySchema } from "@/server/pagination";

const categoryIds = new Set<string>(categories.map((category) => category.id));

const actualsQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(["month", "category", "note", "amount"]).default("month"),
  direction: z.enum(["ascending", "descending"]).default("descending"),
});

const actualInputSchema = z.object({
  categoryId: z.string().refine((value) => categoryIds.has(value), "Unknown category"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM"),
  amount: z
    .string()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Amount must have no more than two decimal places"),
  note: z.string().trim().max(500, "Note must have 500 characters or less").optional(),
});

export { actualInputSchema, actualsQuerySchema };
