import { describe, expect, it } from "vitest";

import { buildReportRows } from "../src/app/dashboard/report";

describe("report aggregation", () => {
  it("sums actual entries only for the matching category and month", () => {
    const [row] = buildReportRows(
      [{ categoryId: "marketing", month: "2026-01", amountCents: 500_000 }],
      [
        { categoryId: "marketing", month: "2026-01", amountCents: 300_000 },
        { categoryId: "marketing", month: "2026-01", amountCents: 180_000 },
        { categoryId: "payroll", month: "2026-01", amountCents: 20_500_000 },
        { categoryId: "marketing", month: "2026-02", amountCents: 10_000 },
      ],
    );

    expect(row).toMatchObject({
      actualCents: 480_000,
      varianceCents: -20_000,
    });
  });
});

describe("report variance", () => {
  it.each([
    {
      name: "under plan",
      planCents: 500_000,
      actualCents: 480_000,
      varianceCents: -20_000,
      variancePercent: -4,
    },
    {
      name: "over plan",
      planCents: 2_000_000,
      actualCents: 2_050_000,
      varianceCents: 50_000,
      variancePercent: 2.5,
    },
    {
      name: "zero plan",
      planCents: 0,
      actualCents: 10_000,
      varianceCents: 10_000,
      variancePercent: null,
    },
  ])(
    "calculates $name variance without an invalid percentage",
    ({ planCents, actualCents, varianceCents, variancePercent }) => {
      const [row] = buildReportRows(
        [{ categoryId: "marketing", month: "2026-01", amountCents: planCents }],
        [{ categoryId: "marketing", month: "2026-01", amountCents: actualCents }],
      );

      expect(row).toMatchObject({ varianceCents, variancePercent });
    },
  );
});
