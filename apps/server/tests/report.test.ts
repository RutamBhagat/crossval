import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualAggregate: vi.fn(),
  actualFind: vi.fn(),
  actualLean: vi.fn(),
  actualSort: vi.fn(),
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

import {
  buildMonthlyVariance,
  buildReportCsv,
  buildReportRows,
} from "@crossval/domain/report";

import { reportsRouter } from "../src/routers/reports";

describe("report aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.actualFind.mockReturnValue({ sort: mocks.actualSort });
    mocks.actualSort.mockReturnValue({ lean: mocks.actualLean });
    mocks.actualLean.mockResolvedValue([]);
    mocks.actualAggregate.mockResolvedValue([
      {
        rows: [
          {
            categoryId: "marketing",
            month: "2026-01",
            planCents: 500_000,
            actualCents: 480_000,
            varianceCents: -20_000,
            variancePercent: -4,
          },
        ],
        monthlyVariance: [{ month: "2026-01", varianceCents: -20_000 }],
        metadata: [{ total: 1 }],
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
      monthlyVariance: [{ month: "2026-01", varianceCents: -20_000 }],
      total: 1,
      offset: 0,
      limit: 10,
    });
    expect(mocks.actualAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          $match: {
            userId: "user-1",
            month: { $gte: "2026-01", $lte: "2026-03" },
          },
        },
        expect.objectContaining({
          $unionWith: expect.objectContaining({ coll: "plans" }),
        }),
        expect.objectContaining({ $facet: expect.any(Object) }),
      ]),
    );
  });

  it("sorts before pagination and calculates chart totals from every report row", async () => {
    mocks.actualAggregate.mockResolvedValue([
      {
        rows: [
          {
            categoryId: "marketing",
            month: "2026-02",
            planCents: 400_000,
            actualCents: 450_000,
            varianceCents: 50_000,
            variancePercent: 12.5,
          },
        ],
        monthlyVariance: [
          { month: "2026-01", varianceCents: -75_000 },
          { month: "2026-02", varianceCents: 50_000 },
        ],
        metadata: [{ total: 3 }],
      },
    ]);

    const response = await reportsRouter.request(
      "/?start=2026-01&end=2026-02&sort=target&direction=descending&offset=1&limit=1",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reports: [
        {
          categoryId: "marketing",
          month: "2026-02",
          planCents: 400_000,
          actualCents: 450_000,
          varianceCents: 50_000,
          variancePercent: 12.5,
        },
      ],
      monthlyVariance: [
        { month: "2026-01", varianceCents: -75_000 },
        { month: "2026-02", varianceCents: 50_000 },
      ],
      total: 3,
      offset: 1,
      limit: 1,
    });
    const pipeline = mocks.actualAggregate.mock.calls[0]?.[0];
    const facet = pipeline.find(
      (stage: Record<string, unknown>) => "$facet" in stage,
    ).$facet;
    expect(facet.rows).toEqual(
      expect.arrayContaining([
        { $sort: { planCents: -1, month: 1, categoryId: 1 } },
        { $skip: 1 },
        { $limit: 1 },
      ]),
    );
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
    const [row] = buildReportRows(
      [],
      [
        {
          categoryId: "tools",
          month: "2026-02",
          actualCents: 50_000,
        },
      ],
    );

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

describe("report range validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "/?start=2026-00&end=2026-01",
    "/?start=2026-01&end=2026-13",
    "/?start=2026-1&end=2026-02",
    "/?start=2026-03&end=2026-02",
    "/export?start=2026-03&end=2026-02",
  ])("rejects invalid report range %s before loading data", async (path) => {
    const response = await reportsRouter.request(path);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toEqual(expect.any(String));
    expect(mocks.actualAggregate).not.toHaveBeenCalled();
  });
});

describe("report output", () => {
  it("combines category variances into chronological monthly totals", () => {
    const rows = buildReportRows(
      [
        { categoryId: "marketing", month: "2026-02", amountCents: 40_000 },
        { categoryId: "payroll", month: "2026-01", amountCents: 100_000 },
        { categoryId: "tools", month: "2026-01", amountCents: 20_000 },
      ],
      [
        { categoryId: "marketing", month: "2026-02", actualCents: 35_000 },
        { categoryId: "payroll", month: "2026-01", actualCents: 110_000 },
        { categoryId: "tools", month: "2026-01", actualCents: 17_500 },
      ],
    );

    expect(buildMonthlyVariance(rows)).toEqual([
      { month: "2026-01", varianceCents: 7_500 },
      { month: "2026-02", varianceCents: -5_000 },
    ]);
  });

  it("exports exact decimal amounts and escapes CSV category names", () => {
    const csv = buildReportCsv(
      [
        {
          categoryId: "consulting",
          month: "2026-03",
          planCents: 12_345,
          actualCents: 10_000,
          varianceCents: -2_345,
          variancePercent: -19,
        },
        {
          categoryId: "unplanned",
          month: "2026-04",
          planCents: 0,
          actualCents: 99,
          varianceCents: 99,
          variancePercent: null,
        },
      ],
      (categoryId) =>
        categoryId === "consulting" ? 'Consulting, "External"' : "Unplanned",
    );

    expect(csv).toBe(
      "Month,Category,Plan,Actual,Variance,Variance %\r\n" +
        '2026-03,"Consulting, ""External""",123.45,100.00,-23.45,-19.00\r\n' +
        "2026-04,Unplanned,0.00,0.99,0.99,N/A\r\n",
    );
  });
});
