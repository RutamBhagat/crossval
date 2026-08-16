import "@/validation-config";

import { type } from "arktype";

const Offset = type("string.integer.parse")
  .to("number >= 0")
  .configure({ message: "Offset must be zero or greater" });

const Limit = type("string.integer.parse")
  .to("1 <= number <= 50")
  .configure({ message: "Limit must be between 1 and 50" });

const paginationQueryFields = {
  offset: Offset.default("0"),
  limit: Limit.default("10"),
} as const;

export { paginationQueryFields };
