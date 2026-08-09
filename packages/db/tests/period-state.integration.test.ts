import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { connection } from "../src/index";
import { Actual } from "../src/models/actual.model";
import { PeriodState } from "../src/models/period-state.model";
import { closePeriod, runIfPeriodsOpen } from "../src/period-state";

const testUserIds = new Set<string>();

function testUserId() {
  const userId = `period-state-integration-${randomUUID()}`;
  testUserIds.add(userId);
  return userId;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function wait(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe("period-state transaction integration", () => {
  beforeAll(async () => {
    await Promise.all([PeriodState.init(), Actual.init()]);
  });

  afterEach(async () => {
    const userIds = [...testUserIds];
    await Promise.all([
      PeriodState.deleteMany({ userId: { $in: userIds } }),
      Actual.deleteMany({ userId: { $in: userIds } }),
    ]);
    testUserIds.clear();
  });

  afterAll(async () => {
    await connection.close();
  });

  it("rolls back the guard and does not write when one period is locked", async () => {
    const userId = testUserId();
    await PeriodState.create([
      { userId, month: "2026-01", locked: false },
      { userId, month: "2026-02", locked: true },
    ]);

    const result = await runIfPeriodsOpen(
      userId,
      ["2026-01", "2026-02"],
      (session) =>
        Actual.create(
          [{ userId, categoryId: "marketing", month: "2026-01", amountCents: 100 }],
          { session },
        ),
    );

    expect(result).toEqual({ ok: false, lockedMonth: "2026-02" });
    await expect(Actual.countDocuments({ userId })).resolves.toBe(0);
    await expect(
      PeriodState.findOne({ userId, month: "2026-01" }).lean(),
    ).resolves.toMatchObject({ locked: false, revision: 0 });
  });

  it("makes close wait for an in-flight guarded write, then leaves the period locked", async () => {
    const userId = testUserId();
    const month = "2026-03";
    await PeriodState.create({ userId, month, locked: false });

    const writeCanFinish = deferred();
    const writeHasLock = deferred();
    let closeFinished = false;
    const completionOrder: string[] = [];

    const writePromise = runIfPeriodsOpen(
      userId,
      [month],
      async (session) => {
        writeHasLock.resolve();
        await writeCanFinish.promise;
        await Actual.create(
          [{ userId, categoryId: "payroll", month, amountCents: 500 }],
          { session },
        );
        return "written";
      },
    ).then((result) => {
      completionOrder.push("write committed");
      return result;
    });

    await writeHasLock.promise;

    const closePromise = closePeriod(userId, month).then((state) => {
      closeFinished = true;
      completionOrder.push("close completed");
      return state;
    });

    await wait(100);
    expect(closeFinished).toBe(false);

    writeCanFinish.resolve();
    const writeResult = await writePromise;
    const closedState = await closePromise;

    expect(writeResult.ok).toBe(true);
    expect(closedState).toMatchObject({ locked: true });
    expect(completionOrder).toEqual(["write committed", "close completed"]);
    await expect(Actual.countDocuments({ userId, month })).resolves.toBe(1);
    await expect(PeriodState.findOne({ userId, month }).lean()).resolves.toMatchObject({
      locked: true,
      revision: 2,
    });
  });

  it("rejects a guarded write after close commits", async () => {
    const userId = testUserId();
    const month = "2026-04";

    await closePeriod(userId, month);
    const result = await runIfPeriodsOpen(userId, [month], (session) =>
      Actual.create(
        [{ userId, categoryId: "tools", month, amountCents: 250 }],
        { session },
      ),
    );

    expect(result).toEqual({ ok: false, lockedMonth: month });
    await expect(Actual.countDocuments({ userId, month })).resolves.toBe(0);
  });
});
