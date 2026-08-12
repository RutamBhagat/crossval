import { PeriodState } from "@crossval/db/models/period-state.model";
import { closePeriod } from "@crossval/db/period-state";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireAuth, type AuthVariables } from "@/middleware/auth";

import { lockInputSchema } from "./schema";

const locksRouter = new Hono<{ Variables: AuthVariables }>();

locksRouter.use("*", requireAuth);

locksRouter.get("/", async (c) => {
  const locks = await PeriodState.find({
    userId: c.get("userId"),
    locked: { $ne: false },
  })
    .sort({ month: -1 })
    .lean();

  return c.json({
    locks: locks.map((lock) => ({
      id: lock._id.toString(),
      month: lock.month,
    })),
  });
});

locksRouter.put(
  "/",
  zValidator("json", lockInputSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid lock" },
        400,
      );
    }
  }),
  async (c) => {
    const { month } = c.req.valid("json");
    const lock = await closePeriod(c.get("userId"), month);

    if (!lock) {
      return c.json({ error: "Month could not be locked" }, 500);
    }

    return c.json({
      lock: {
        id: lock._id.toString(),
        month: lock.month,
      },
    });
  },
);

export { locksRouter };
