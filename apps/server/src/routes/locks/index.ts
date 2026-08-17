import { PeriodState } from "@crossval/db/models/period-state.model";
import { closePeriod } from "@crossval/db/period-state";
import { Elysia } from "elysia";

import { authPlugin } from "../../plugins/auth.js";
import { commonModels } from "../../schemas/common.js";
import { LockInput, LocksResponse, LockSaveResponse } from "./schema.js";

const locksRoutes = new Elysia({ prefix: "/locks" })
  .use(commonModels)
  .use(authPlugin)
  .get(
    "/",
    async ({ userId }) => {
      const locks = await PeriodState.find({
        userId,
        locked: { $ne: false },
      })
        .sort({ month: -1 })
        .lean();

      return {
        locks: locks.map((lock) => ({
          id: lock._id.toString(),
          month: lock.month,
        })),
      };
    },
    {
      auth: true,
      response: {
        200: LocksResponse,
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .put(
    "/",
    async ({ body, userId }) => {
      const lock = await closePeriod(userId, body.month);
      if (!lock) throw new Error("Month was not locked");

      return { lock: { id: lock._id.toString(), month: lock.month } };
    },
    {
      auth: true,
      body: LockInput,
      response: {
        200: LockSaveResponse,
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  );

export { locksRoutes };
