import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actualCreate: vi.fn(),
  actualInsertMany: vi.fn(),
  planSave: vi.fn(),
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
  Actual: { create: mocks.actualCreate, insertMany: mocks.actualInsertMany },
}));

import { actualsRouter } from "../src/server/routers/actuals";
import { plansRouter } from "../src/server/routers/plans";

function allowWrites() {
  const session = { id: "session-1" };
  mocks.runIfPeriodsOpen.mockImplementation(
    async (
      _userId: string,
      _months: string[],
      operation: (session: object) => Promise<unknown>,
    ) => ({ ok: true, value: await operation(session) }),
  );
  return session;
}

describe("monthly lock enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runIfPeriodsOpen.mockResolvedValue({
      ok: false,
      lockedMonth: "2026-01",
    });
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

  it("saves a plan in the guarded transaction", async () => {
    const session = allowWrites();
    mocks.planSave.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "plan-1",
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 10000,
      }),
    });

    const response = await plansRouter.request("/", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "marketing",
        month: "2026-01",
        amount: "100.00",
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.planSave).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ session }),
    );
  });

  it("imports actuals in one guarded transaction", async () => {
    const session = allowWrites();
    mocks.actualInsertMany.mockResolvedValue([]);
    const body = new FormData();
    body.set(
      "file",
      new File(["month,category,amount\n2026-01,Marketing,100.00"], "actuals.csv"),
    );

    const response = await actualsRouter.request("/import", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(201);
    expect(mocks.runIfPeriodsOpen).toHaveBeenCalledWith(
      "user-1",
      ["2026-01"],
      expect.any(Function),
    );
    expect(mocks.actualInsertMany).toHaveBeenCalledWith(expect.anything(), { session });
  });

  it("saves an actual in the guarded transaction", async () => {
    const session = allowWrites();
    mocks.actualCreate.mockResolvedValue([
      {
        _id: "actual-1",
        categoryId: "marketing",
        month: "2026-01",
        amountCents: 10000,
      },
    ]);

    const response = await actualsRouter.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: "marketing",
        month: "2026-01",
        amount: "100.00",
      }),
    });

    expect(response.status).toBe(201);
    expect(mocks.actualCreate).toHaveBeenCalledWith(expect.anything(), { session });
  });
});
