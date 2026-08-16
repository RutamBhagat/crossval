import { type } from "arktype";

import { categories } from "@crossval/domain/categories";

const categoryIds = new Set<string>(
  categories.map((category) => category.id),
);

const CategoryId = type("string").narrow((value, ctx) =>
  categoryIds.has(value) ? true : ctx.mustBe("a known category"),
);

const Month = type(/^\d{4}-(0[1-9]|1[0-2])$/).configure({
  message: "Month must use YYYY-MM",
});

const Amount = type(/^\d+(?:\.\d{1,2})?$/).configure({
  message: "Amount must have no more than two decimal places",
});

export { Amount, CategoryId, Month };
