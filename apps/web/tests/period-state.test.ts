import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

vi.mock("../../../packages/db/src/index", () => ({
  connection: { transaction: mocks.transaction },
}));

vi.mock("../../../packages/db/src/models/period-state.model", () => ({
  PeriodState: { findOneAndUpdate: mocks.findOneAndUpdate },
}));

import { runIfPeriodsOpen } from "../../../packages/db/src/period-state";

describe("multi-period lock guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(
      async (operation: (session: object) => Promise<unknown>) =>
        operation({ id: "transaction-1" }),
    );
  });

  it("does not start the write when any month in the transaction is locked", async () => {
    mocks.findOneAndUpdate
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ month: "2026-01", locked: false }),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ month: "2026-02", locked: true }),
      });
    const write = vi.fn();

    const result = await runIfPeriodsOpen(
      "user-1",
      ["2026-01", "2026-02"],
      write,
    );

    expect(result).toEqual({ ok: false, lockedMonth: "2026-02" });
    expect(write).not.toHaveBeenCalled();
    expect(mocks.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      { userId: "user-1", month: "2026-01" },
      { $inc: { revision: 1 } },
      expect.objectContaining({ session: { id: "transaction-1" } }),
    );
    expect(mocks.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { userId: "user-1", month: "2026-02" },
      { $inc: { revision: 1 } },
      expect.objectContaining({ session: { id: "transaction-1" } }),
    );
  });
});
