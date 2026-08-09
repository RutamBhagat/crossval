import type { ClientSession } from "mongoose";

import { connection } from "./index";
import { PeriodState } from "./models/period-state.model";

class PeriodLockedError extends Error {
  constructor(readonly month: string) {
    super(`Period ${month} is locked`);
  }
}

type OpenPeriodResult<T> =
  { ok: true; value: T } | { ok: false; lockedMonth: string };

async function closePeriod(userId: string, month: string) {
  return PeriodState.findOneAndUpdate(
    { userId, month },
    { $set: { locked: true }, $inc: { revision: 1 } },
    { new: true, runValidators: true, upsert: true },
  ).lean();
}

async function runIfPeriodsOpen<T>(
  userId: string,
  months: readonly string[],
  operation: (session: ClientSession) => Promise<T>,
): Promise<OpenPeriodResult<T>> {
  try {
    const value = await connection.transaction(async (session) => {
      for (const month of new Set(months)) {
        // Updating this row makes a concurrent lock wait for this transaction.
        const state = await PeriodState.findOneAndUpdate(
          { userId, month },
          { $inc: { revision: 1 } },
          { new: true, runValidators: true, session, upsert: true },
        ).lean();

        if (state?.locked !== false) {
          throw new PeriodLockedError(month);
        }
      }

      return operation(session);
    });

    return { ok: true, value };
  } catch (error) {
    if (error instanceof PeriodLockedError) {
      return { ok: false, lockedMonth: error.month };
    }
    throw error;
  }
}

export { closePeriod, runIfPeriodsOpen };
