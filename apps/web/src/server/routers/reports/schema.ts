import { z } from "zod";

import { paginationQuerySchema } from "@/server/pagination";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM");

const reportQuerySchema = paginationQuerySchema
  .extend({
    start: monthSchema,
    end: monthSchema,
    sort: z.enum(["month", "category", "target"]).default("month"),
    direction: z.enum(["ascending", "descending"]).default("ascending"),
  })
  .refine(({ start, end }) => start <= end, {
    message: "End month must not be before start month",
    path: ["end"],
  });

export { reportQuerySchema };
