import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  planSave: vi.fn(),
  actualCreate: vi.fn(),
  runIfPeriodsOpen: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
    },
  },
}));

vi.mock("@crossval/db/period-state", () => ({
  runIfPeriodsOpen: mocks.runIfPeriodsOpen,
}));

vi.mock("@crossval/db/models/plan.model", () => ({
  Plan: { findOneAndUpdate: mocks.planSave },
}));

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: { create: mocks.actualCreate },
}));

import { actualsRouter } from "../src/server/routers/actuals";
import { plansRouter } from "../src/server/routers/plans";

const writeEndpoints = [
  { name: "plan", router: plansRouter, method: "PUT" },
  { name: "actual", router: actualsRouter, method: "POST" },
] as const;

function writeRequest(
  endpoint: (typeof writeEndpoints)[number],
  month: string,
  amount: string,
) {
  return endpoint.router.request("/", {
    method: endpoint.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ categoryId: "marketing", month, amount }),
  });
}

describe("plan and actual input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const endpoint of writeEndpoints) {
    it.each(["2026-00", "2026-13", "2026-1"])(
      `rejects invalid ${endpoint.name} month %s before the lock or database write`,
      async (month) => {
        const response = await writeRequest(endpoint, month, "100.00");

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
          error: "Month must use YYYY-MM",
        });
        expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
        expect(mocks.planSave).not.toHaveBeenCalled();
        expect(mocks.actualCreate).not.toHaveBeenCalled();
      },
    );

    it.each(["-1.00", "12x", "1.001"])(
      `rejects invalid ${endpoint.name} amount %s before the lock or database write`,
      async (amount) => {
        const response = await writeRequest(endpoint, "2026-01", amount);

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
          error: "Amount must have no more than two decimal places",
        });
        expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
        expect(mocks.planSave).not.toHaveBeenCalled();
        expect(mocks.actualCreate).not.toHaveBeenCalled();
      },
    );
  }
});
