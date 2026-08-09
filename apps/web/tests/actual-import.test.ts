import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insertMany: vi.fn(),
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

vi.mock("@crossval/db/models/actual.model", () => ({
  Actual: { insertMany: mocks.insertMany },
}));

import { actualsRouter } from "../src/server/routers/actuals";

function csvRequest(csv: string) {
  const body = new FormData();
  body.set("file", new File([csv], "actuals.csv", { type: "text/csv" }));
  return actualsRouter.request("/import", { method: "POST", body });
}

describe("actual CSV import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertMany.mockResolvedValue([]);
    mocks.runIfPeriodsOpen.mockImplementation(
      async (
        _userId: string,
        _months: string[],
        operation: (session: object) => Promise<unknown>,
      ) => ({ ok: true, value: await operation({ id: "session-1" }) }),
    );
  });

  it("normalizes every valid row and inserts the file in one guarded operation", async () => {
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
      { session: { id: "session-1" } },
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
      error: "Invalid CSV row 3",
    });
    expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });

  it.each(["2026-00", "2026-13", "2026-1"])(
    "rejects invalid month %s",
    async (month) => {
      const response = await csvRequest(
        `month,category,amount\n${month},Marketing,100.00\n`,
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid CSV row 2",
      });
      expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
      expect(mocks.insertMany).not.toHaveBeenCalled();
    },
  );

  it.each(["-1.00", "12x", "1.001"])(
    "rejects invalid amount %s",
    async (amount) => {
      const response = await csvRequest(
        `month,category,amount\n2026-01,Marketing,${amount}\n`,
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid CSV row 2",
      });
      expect(mocks.runIfPeriodsOpen).not.toHaveBeenCalled();
      expect(mocks.insertMany).not.toHaveBeenCalled();
    },
  );

  it("rejects an amount that cannot be stored as exact integer cents", async () => {
    const response = await csvRequest(
      "month,category,amount\n2026-01,Marketing,90071992547409.92\n",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid CSV row 2",
    });
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });

  it("rejects mixed open and locked months without inserting any row", async () => {
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
      error: "CSV contains actuals for a locked month",
    });
    expect(mocks.runIfPeriodsOpen).toHaveBeenCalledWith(
      "user-1",
      ["2026-01", "2026-02"],
      expect.any(Function),
    );
    expect(mocks.insertMany).not.toHaveBeenCalled();
  });
});
