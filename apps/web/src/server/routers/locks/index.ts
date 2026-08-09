import { PeriodLock } from "@crossval/db/models/period-lock.model";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

import { lockInputSchema } from "./schema";

const locksRouter = new Hono<{ Variables: AuthVariables }>();

locksRouter.use("*", requireAuth);

locksRouter.get("/", async (c) => {
  const locks = await PeriodLock.find({ userId: c.get("userId") })
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
    const lock = await PeriodLock.findOneAndUpdate(
      { userId: c.get("userId"), month },
      { $setOnInsert: { userId: c.get("userId"), month } },
      { new: true, runValidators: true, upsert: true },
    ).lean();

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
