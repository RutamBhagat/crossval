import { randomUUID } from "node:crypto";

import {
  afterEach,
  beforeAll,

  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

import { Actual } from "@crossval/db/models/actual.model";
import { Plan } from "@crossval/db/models/plan.model";

import { reportsRouter } from "../src/routers/reports";

const testUserIds = new Set<string>();

function testUserId(label: string) {
  const userId = `report-integration-${label}-${randomUUID()}`;
  testUserIds.add(userId);
  return userId;
}

describe("report MongoDB aggregation integration", () => {
  beforeAll(async () => {
    await Promise.all([Actual.init(), Plan.init()]);
  });

  afterEach(async () => {
    const userIds = [...testUserIds];
    await Promise.all([
      Actual.deleteMany({ userId: { $in: userIds } }),
      Plan.deleteMany({ userId: { $in: userIds } }),
    ]);
    testUserIds.clear();
    vi.clearAllMocks();
  });


  it("calculates report rows in MongoDB without leaking another user's data", async () => {
    const userId = testUserId("owner");
    const otherUserId = testUserId("other");
    mocks.getSession.mockResolvedValue({ user: { id: userId } });

    await Plan.create([
      {
        userId,
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 500_000,
      },
      {
        userId,
        categoryId: "payroll",
        month: "2026-01",
        amountCents: 2_000_000,
      },
      {
        userId,
        categoryId: "marketing",
        month: "2026-02",
        amountCents: 500_000,
      },
      {
        userId,
        categoryId: "payroll",
        month: "2026-02",
        amountCents: 2_000_000,
      },
      {
        userId: otherUserId,
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 9_000_000_000,
      },
    ]);
    await Actual.create([
      {
        userId,
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 300_000,
      },
      {
        userId,
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 180_000,
      },
      {
        userId,
        categoryId: "payroll",
        month: "2026-01",
        amountCents: 2_050_000,
      },
      {
        userId,
        categoryId: "payroll",
        month: "2026-02",
        amountCents: 1_980_000,
      },
      { userId, categoryId: "tools", month: "2026-02", amountCents: 25_000 },
      {
        userId: otherUserId,
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 8_000_000_000,
      },
    ]);

    const response = await reportsRouter.request(
      "/?start=2026-01&end=2026-02&limit=10",
    );

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
        {
          categoryId: "payroll",
          month: "2026-01",
          planCents: 2_000_000,
          actualCents: 2_050_000,
          varianceCents: 50_000,
          variancePercent: 2.5,
        },
        {
          categoryId: "marketing",
          month: "2026-02",
          planCents: 500_000,
          actualCents: 0,
          varianceCents: -500_000,
          variancePercent: -100,
        },
        {
          categoryId: "payroll",
          month: "2026-02",
          planCents: 2_000_000,
          actualCents: 1_980_000,
          varianceCents: -20_000,
          variancePercent: -1,
        },
        {
          categoryId: "tools",
          month: "2026-02",
          planCents: 0,
          actualCents: 25_000,
          varianceCents: 25_000,
          variancePercent: null,
        },
      ],
      monthlyVariance: [
        { month: "2026-01", varianceCents: 30_000 },
        { month: "2026-02", varianceCents: -495_000 },
      ],
      total: 5,
      offset: 0,
      limit: 10,
    });
  });
});
