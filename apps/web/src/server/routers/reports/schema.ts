import { z } from "zod";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM");

const reportQuerySchema = z
  .object({
    start: monthSchema,
    end: monthSchema,
  })
  .refine(({ start, end }) => start <= end, {
    message: "End month must not be before start month",
    path: ["end"],
  });

export { reportQuerySchema };
