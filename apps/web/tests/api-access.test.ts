import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  planFind: vi.fn(),
  planCount: vi.fn(),
  actualFind: vi.fn(),
  actualCount: vi.fn(),
  actualAggregate: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@crossval/db/models/plan.model", () => ({
  Plan: {
    find: mocks.planFind,
    countDocuments: mocks.planCount,
  },
}));

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: {
    find: mocks.actualFind,
    countDocuments: mocks.actualCount,
    aggregate: mocks.actualAggregate,
  },
}));

import { actualsRouter } from "../src/server/routers/actuals";
import { plansRouter } from "../src/server/routers/plans";
import { reportsRouter } from "../src/server/routers/reports";

type RecordWithUser = {
  _id: string;
  userId: string;
  categoryId: string;
  month: string;
  amountCents: number;
  note?: string;
};

function queryResult<T>(rows: T[]) {
  let offset = 0;
  let limit = rows.length;
  const query = {
    sort: vi.fn(() => query),
    skip: vi.fn((value: number) => {
      offset = value;
      return query;
    }),
    limit: vi.fn((value: number) => {
      limit = value;
      return query;
    }),
    lean: vi.fn(async () => rows.slice(offset, offset + limit)),
  };
  return query;
}

const plans: RecordWithUser[] = [
  {
    _id: "plan-a",
    userId: "user-a",
    categoryId: "marketing",
    month: "2026-01",
    amountCents: 20_000,
  },
  {
    _id: "plan-b",
    userId: "user-b",
    categoryId: "payroll",
    month: "2026-01",
    amountCents: 999_999,
  },
];

const actuals: RecordWithUser[] = [
  {
    _id: "actual-a-1",
    userId: "user-a",
    categoryId: "marketing",
    month: "2026-01",
    amountCents: 6_000,
  },
  {
    _id: "actual-a-2",
    userId: "user-a",
    categoryId: "marketing",
    month: "2026-01",
    amountCents: 4_000,
  },
  {
    _id: "actual-b",
    userId: "user-b",
    categoryId: "payroll",
    month: "2026-01",
    amountCents: 888_888,
  },
];

function matches(record: RecordWithUser, filter: Record<string, unknown>) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "month" && typeof expected === "object" && expected) {
      const range = expected as { $gte: string; $lte: string };
      return record.month >= range.$gte && record.month <= range.$lte;
    }
    return record[key as keyof RecordWithUser] === expected;
  });
}

describe("API access boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-a" } });
    mocks.planFind.mockImplementation((filter: Record<string, unknown>) =>
      queryResult(plans.filter((record) => matches(record, filter))),
    );
    mocks.planCount.mockImplementation(
      async (filter: Record<string, unknown>) =>
        plans.filter((record) => matches(record, filter)).length,
    );
    mocks.actualFind.mockImplementation((filter: Record<string, unknown>) =>
      queryResult(actuals.filter((record) => matches(record, filter))),
    );
    mocks.actualCount.mockImplementation(
      async (filter: Record<string, unknown>) =>
        actuals.filter((record) => matches(record, filter)).length,
    );
    mocks.actualAggregate.mockResolvedValue([
      {
        rows: [
          {
            categoryId: "marketing",
            month: "2026-01",
            planCents: 20_000,
            actualCents: 10_000,
            varianceCents: -10_000,
            variancePercent: -50,
          },
        ],
        monthlyVariance: [{ month: "2026-01", varianceCents: -10_000 }],
        metadata: [{ total: 1 }],
      },
    ]);
  });

  it.each([
    ["plans", plansRouter, "/"],
    ["actuals", actualsRouter, "/"],
    ["reports", reportsRouter, "/?start=2026-01&end=2026-01"],
  ])(
    "returns 401 for unauthenticated %s requests",
    async (_name, router, path) => {
      mocks.getSession.mockResolvedValue(null);

      const response = await router.request(path);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "Authentication required",
      });
      expect(mocks.planFind).not.toHaveBeenCalled();
      expect(mocks.actualFind).not.toHaveBeenCalled();
      expect(mocks.actualAggregate).not.toHaveBeenCalled();
    },
  );

  it("keeps another user's plans, actuals, and report totals out of user A's responses", async () => {
    const [planResponse, actualResponse, reportResponse] = await Promise.all([
      plansRouter.request("/"),
      actualsRouter.request("/"),
      reportsRouter.request("/?start=2026-01&end=2026-01"),
    ]);

    await expect(planResponse.json()).resolves.toMatchObject({
      plans: [{ id: "plan-a", categoryId: "marketing", amountCents: 20_000 }],
      total: 1,
    });
    await expect(actualResponse.json()).resolves.toMatchObject({
      actuals: [
        { id: "actual-a-1", categoryId: "marketing", amountCents: 6_000 },
        { id: "actual-a-2", categoryId: "marketing", amountCents: 4_000 },
      ],
      total: 2,
    });
    await expect(reportResponse.json()).resolves.toMatchObject({
      reports: [
        {
          categoryId: "marketing",
          month: "2026-01",
          planCents: 20_000,
          actualCents: 10_000,
          varianceCents: -10_000,
          variancePercent: -50,
        },
      ],
      total: 1,
    });

    expect(mocks.planFind).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-a" }),
    );
    expect(mocks.actualFind).toHaveBeenCalledWith({ userId: "user-a" });
    expect(mocks.actualAggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: expect.objectContaining({ userId: "user-a" }) },
        {
          $unionWith: expect.objectContaining({
            pipeline: expect.arrayContaining([
              { $match: expect.objectContaining({ userId: "user-a" }) },
            ]),
          }),
        },
      ]),
    );
  });
});
