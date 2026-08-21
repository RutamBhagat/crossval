import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  insertMany: vi.fn(),
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

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: Object.assign(vi.fn(), {
    countDocuments: vi.fn(),
    find: vi.fn(),
    insertMany: mocks.insertMany,
  }),
}));

import { actualsRoutes } from "../src/routes/actuals/index.js";

const app = new Elysia().use(actualsRoutes);
const session = { id: "session-1" };

function csvRequest(csv: string) {
  const body = new FormData();
  body.set("file", new File([csv], "actuals.csv", { type: "text/csv" }));

  return app.handle(
    new Request("http://localhost/actuals/import", {
      method: "POST",
      body,
    }),
  );
}

describe("actual CSV import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userLimit.mockResolvedValue({ success: true });
    mocks.insertMany.mockResolvedValue([]);
    mocks.runIfPeriodsOpen.mockImplementation(
      async (_userId, _months, operation) => ({
        ok: true,
        value: await operation(session),
      }),
    );
  });

  it("normalizes valid rows and writes them in one guarded operation", async () => {
    const response = await csvRequest(
      "\ufeffmonth,category,amount\n" +
        "2026-01,Marketing,1200.5\n" +
        "2026-01,PAYROLL,42.00\n" +
        "2026-02,tools,0.01\n",
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ imported: 3 });
    expect(mocks.runIfPeriodsOpen).toHaveBeenCalledWith(
      "user-1",
      ["2026-01", "2026-02"],
      expect.any(Function),
    );
    expect(mocks.insertMany).toHaveBeenCalledWith(
      [
        {
          userId: "user-1",
          month: "2026-01",
          categoryId: "marketing",
          amountCents: 120_050,
        },
        {
          userId: "user-1",
          month: "2026-01",
          categoryId: "payroll",
          amountCents: 4_200,
        },
        {
          userId: "user-1",
          month: "2026-02",
          categoryId: "tools",
          amountCents: 1,
        },
      ],
      { session },
    );
  });

  it("rejects the whole file before writing when a later row is invalid", async () => {
    const response = await csvRequest(
      "month,category,amount\n" +
        "2026-01,Marketing,100.00\n" +
        "2026-02,Unknown,50.00\n",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      type: "invalid_import",
      message: "Invalid CSV row 3",
    });
    expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });

  it("does not insert any row when the import contains a locked month", async () => {
    mocks.runIfPeriodsOpen.mockResolvedValue({
      ok: false,
      lockedMonth: "2026-02",
    });

    const response = await csvRequest(
      "month,category,amount\n" +
        "2026-01,Marketing,100.00\n" +
        "2026-02,Payroll,200.00\n",
    );
    expect(response.status).toBe(423);
    await expect(response.json()).resolves.toEqual({
      type: "period_locked",
      message: "CSV contains actuals for a locked month",
    });
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });
});
