import { categoryIds } from "@crossval/domain/categories";
import { Elysia, t } from "elysia";

const ApiError = t.Object({
  type: t.String(),
  message: t.String(),
});

const RateLimitError = t.Object({
  type: t.Literal("rate_limit_exceeded"),
  message: t.String(),
  policy: t.UnionEnum(["ip", "user"]),
  retryAfter: t.Integer({ minimum: 1 }),
});

const Month = t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" });
const CategoryId = t.UnionEnum(categoryIds);
const sortDirection = (defaultValue: 1 | -1) =>
  t
    .Transform(
      t.UnionEnum(["1", "-1"], { default: String(defaultValue) }),
    )
    .Decode((value): 1 | -1 => (value === "1" ? 1 : -1))
    .Encode((value) => String(value) as "1" | "-1");

const commonModels = new Elysia({ name: "schemas.common" }).model({
  "error.api": ApiError,
  "error.rateLimit": RateLimitError,
});

export { ApiError, CategoryId, commonModels, Month, RateLimitError, sortDirection };
