import { z } from "zod";

const paginationQuerySchema = z.object({
  offset: z.coerce.number().int().min(0, "Offset must be zero or greater").default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be 50 or less")
    .default(10),
});

export { paginationQuerySchema };
