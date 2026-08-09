import { zValidator } from "@hono/zod-validator";
import { PeriodLock } from "@crossval/db/models/period-lock.model";
import { Plan } from "@crossval/db/models/plan.model";
import { Hono } from "hono";

import { amountToCents } from "@/server/money";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

import { planInputSchema, plansQuerySchema } from "./schema";

const plansRouter = new Hono<{ Variables: AuthVariables }>();

plansRouter.use("*", requireAuth);

plansRouter.get(
  "/",
  zValidator("query", plansQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid query" },
        400,
      );
    }
  }),
  async (c) => {
    const { direction, limit, offset, sort } = c.req.valid("query");
    const filter = { userId: c.get("userId") };
    const sortFields = {
      month: "month",
      category: "categoryId",
      amount: "amountCents",
    } as const;
    const sortDirection = direction === "ascending" ? 1 : -1;
    const databaseSort: Record<string, 1 | -1> = {
      [sortFields[sort]]: sortDirection,
      _id: 1,
    };
    const [plans, total] = await Promise.all([
      Plan.find(filter)
        .sort(databaseSort)
        .skip(offset)
        .limit(limit)
        .lean(),
      Plan.countDocuments(filter),
    ]);

    return c.json({
      plans: plans.map((plan) => ({
        id: plan._id.toString(),
        categoryId: plan.categoryId,
        month: plan.month,
        amountCents: plan.amountCents,
      })),
      total,
      offset,
      limit,
    });
  },
);

plansRouter.put(
  "/",
  zValidator("json", planInputSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid plan" },
        400,
      );
    }
  }),
  async (c) => {
    const input = c.req.valid("json");
    const userId = c.get("userId");
    const periodIsLocked = await PeriodLock.exists({ userId, month: input.month });

    if (periodIsLocked) {
      return c.json({ error: `Plans for ${input.month} are locked` }, 423);
    }

    const amountCents = amountToCents(input.amount);
    if (!Number.isSafeInteger(amountCents)) {
      return c.json({ error: "Amount is too large" }, 400);
    }

    const plan = await Plan.findOneAndUpdate(
      {
        userId,
        categoryId: input.categoryId,
        month: input.month,
      },
      { $set: { amountCents } },
      { new: true, runValidators: true, upsert: true },
    ).lean();

    if (!plan) {
      return c.json({ error: "Plan could not be saved" }, 500);
    }

    return c.json({
      plan: {
        id: plan._id.toString(),
        categoryId: plan.categoryId,
        month: plan.month,
        amountCents: plan.amountCents,
      },
    });
  },
);

export { plansRouter };
