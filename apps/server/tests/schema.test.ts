import { describe, expect, it } from "vitest";

import { actualInputSchema } from "../src/routers/actuals/schema";

describe("ArkType schema configuration", () => {
  it("deletes undeclared input keys", () => {
    const result = actualInputSchema({
      categoryId: "marketing",
      month: "2026-08",
      amount: "10",
      admin: true,
    });

    expect(result).toEqual({
      categoryId: "marketing",
      month: "2026-08",
      amount: "10",
    });
  });
});
