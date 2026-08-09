import { z } from "zod";

import { categories } from "@/lib/categories";
import { paginationQuerySchema } from "@/server/pagination";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM");

const categoryIds = new Set<string>(categories.map((category) => category.id));

const reportActualsQuerySchema = z.object({
  categoryId: z.string().refine((value) => categoryIds.has(value), "Unknown category"),
  month: monthSchema,
});

const reportRangeFields = {
  start: monthSchema,
  end: monthSchema,
  sort: z.enum(["month", "category", "target"]).default("month"),
  direction: z.enum(["ascending", "descending"]).default("ascending"),
};

const validRange = {
  message: "End month must not be before start month",
  path: ["end"] as string[],
};

const reportExportQuerySchema = z
  .object(reportRangeFields)
  .refine(({ start, end }) => start <= end, validRange);

const reportQuerySchema = paginationQuerySchema
  .extend(reportRangeFields)
  .refine(({ start, end }) => start <= end, validRange);

export {
  reportActualsQuerySchema,
  reportExportQuerySchema,
  reportQuerySchema,
};
