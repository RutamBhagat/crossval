import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualAggregate: vi.fn(),
  actualFind: vi.fn(),
  actualLean: vi.fn(),
  actualSort: vi.fn(),
  planFind: vi.fn(),
  planLean: vi.fn(),
  planSort: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
    },
  },
}));

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: { aggregate: mocks.actualAggregate, find: mocks.actualFind },
}));

vi.mock("@crossval/db/models/plan.model", () => ({
  Plan: { find: mocks.planFind },
}));

import { buildReportRows } from "../src/server/report";
import { reportsRouter } from "../src/server/routers/reports";

describe("report aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actualFind.mockReturnValue({ sort: mocks.actualSort });
    mocks.actualSort.mockReturnValue({ lean: mocks.actualLean });
    mocks.actualLean.mockResolvedValue([]);
    mocks.planFind.mockReturnValue({ sort: mocks.planSort });
    mocks.planSort.mockReturnValue({ lean: mocks.planLean });
    mocks.planLean.mockResolvedValue([
      { categoryId: "marketing", month: "2026-01", amountCents: 500_000 },
    ]);
    mocks.actualAggregate.mockResolvedValue([
      {
        _id: { categoryId: "marketing", month: "2026-01" },
        actualCents: 480_000,
      },
    ]);
  });

  it("returns only the authenticated user's entries behind one report row", async () => {
    mocks.actualLean.mockResolvedValue([
      { _id: "actual-1", amountCents: 300_000, note: "Campaign" },
      { _id: "actual-2", amountCents: 180_000 },
    ]);

    const response = await reportsRouter.request(
      "/actuals?categoryId=marketing&month=2026-01",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      actuals: [
        { id: "actual-1", amountCents: 300_000, note: "Campaign" },
        { id: "actual-2", amountCents: 180_000 },
      ],
    });
    expect(mocks.actualFind).toHaveBeenCalledWith({
      userId: "user-1",
      categoryId: "marketing",
      month: "2026-01",
    });
  });

  it("returns server-built rows for the authenticated user and month range", async () => {
    const response = await reportsRouter.request("/?start=2026-01&end=2026-03");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reports: [
        {
          categoryId: "marketing",
          month: "2026-01",
          planCents: 500_000,
          actualCents: 480_000,
          varianceCents: -20_000,
          variancePercent: -4,
        },
      ],
    });
    expect(mocks.planFind).toHaveBeenCalledWith({
      userId: "user-1",
      month: { $gte: "2026-01", $lte: "2026-03" },
    });
    expect(mocks.actualAggregate).toHaveBeenCalledWith([
      {
        $match: {
          userId: "user-1",
          month: { $gte: "2026-01", $lte: "2026-03" },
        },
      },
      {
        $group: {
          _id: { categoryId: "$categoryId", month: "$month" },
          actualCents: { $sum: "$amountCents" },
        },
      },
    ]);
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
        [
          {
            categoryId: "marketing",
            month: "2026-01",
            actualCents,
          },
        ],
      );

      expect(row).toMatchObject({ varianceCents, variancePercent });
    },
  );

  it("treats a missing actual total as zero", () => {
    const [row] = buildReportRows(
      [{ categoryId: "marketing", month: "2026-01", amountCents: 500_000 }],
      [],
    );

    expect(row).toMatchObject({
      actualCents: 0,
      varianceCents: -500_000,
      variancePercent: -100,
    });
  });

  it("includes an actual total without a plan", () => {
    const [row] = buildReportRows([], [
      {
        categoryId: "tools",
        month: "2026-02",
        actualCents: 50_000,
      },
    ]);

    expect(row).toEqual({
      categoryId: "tools",
      month: "2026-02",
      planCents: 0,
      actualCents: 50_000,
      varianceCents: 50_000,
      variancePercent: null,
    });
  });
});
