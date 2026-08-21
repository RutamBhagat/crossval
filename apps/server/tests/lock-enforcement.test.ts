import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualConstructor: vi.fn(),
  getSession: vi.fn(),
  planSave: vi.fn(),
  runIfPeriodsOpen: vi.fn(),
  userLimit: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("../src/rate-limit.js", () => ({
  getRetryAfter: vi.fn(() => 1),
  userRateLimit: { limit: mocks.userLimit },
}));

vi.mock("@crossval/db/period-state", () => ({
  runIfPeriodsOpen: mocks.runIfPeriodsOpen,
}));
vi.mock("@crossval/db/models/plan.model", () => ({
  Plan: { findOneAndUpdate: mocks.planSave },
}));

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: Object.assign(mocks.actualConstructor, {
    countDocuments: vi.fn(),
    find: vi.fn(),
    insertMany: vi.fn(),
  }),
}));

import { actualsRoutes } from "../src/routes/actuals/index.js";
import { plansRoutes } from "../src/routes/plans/index.js";

const app = new Elysia().use(plansRoutes).use(actualsRoutes);

function jsonRequest(path: string, method: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("write boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userLimit.mockResolvedValue({ success: true });
    mocks.runIfPeriodsOpen.mockResolvedValue({
      ok: false,
      lockedMonth: "2026-01",
    });
  });

  it.each([
    {
      name: "plan",
      path: "/plans/",
      method: "PUT",
      body: { categoryId: "marketing", month: "2026-01", amount: 100 },
      write: mocks.planSave,
    },
    {
      name: "actual",
      path: "/actuals/",
      method: "POST",
      body: { categoryId: "marketing", month: "2026-01", amount: "100.00" },
      write: mocks.actualConstructor,
    },
  ])("rejects a $name write for a locked month", async ({ path, method, body, write }) => {
    const response = await app.handle(jsonRequest(path, method, body));

    expect(response.status).toBe(423);
    await expect(response.json()).resolves.toMatchObject({
      type: "period_locked",
      message: expect.stringContaining("2026-01"),
    });
    expect(write).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated writes before checking the period", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await app.handle(
      jsonRequest("/plans/", "PUT", {
        categoryId: "marketing",
        month: "2026-01",
        amount: 100,
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      type: "unauthorized",
      message: "Authentication required",
    });
    expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
  });
});
