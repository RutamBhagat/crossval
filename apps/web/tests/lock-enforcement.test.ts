import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualCreate: vi.fn(),
  planSave: vi.fn(),
  periodLockExists: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
    },
  },
}));

vi.mock("@crossval/db/models/period-lock.model", () => ({
  PeriodLock: { exists: mocks.periodLockExists },
}));

vi.mock("@crossval/db/models/plan.model", () => ({
  Plan: { findOneAndUpdate: mocks.planSave },
}));

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: { create: mocks.actualCreate },
}));

import { actualsRouter } from "../src/server/routers/actuals";
import { plansRouter } from "../src/server/routers/plans";

describe("monthly lock enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.periodLockExists.mockResolvedValue(true);
  });

  it.each([
    { name: "plan", router: plansRouter, method: "PUT", write: mocks.planSave },
    { name: "actual", router: actualsRouter, method: "POST", write: mocks.actualCreate },
  ])("rejects a $name write for a locked month", async ({ router, method, write }) => {
    const response = await router.request("/", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "marketing",
        month: "2026-01",
        amount: "100.00",
      }),
    });

    expect(response.status).toBe(423);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("2026-01"),
    });
    expect(write).not.toHaveBeenCalled();
  });
});
