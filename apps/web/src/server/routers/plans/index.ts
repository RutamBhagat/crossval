import { zValidator } from "@hono/zod-validator";
import { Plan } from "@crossval/db/models/plan.model";
import { Hono } from "hono";

import { amountToCents } from "@/server/money";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

import { planInputSchema } from "./schema";

const plansRouter = new Hono<{ Variables: AuthVariables }>();

plansRouter.use("*", requireAuth);

plansRouter.get("/", async (c) => {
  const plans = await Plan.find({ userId: c.get("userId") })
    .sort({ month: -1, categoryId: 1 })
    .lean();

  return c.json({
    plans: plans.map((plan) => ({
      id: plan._id.toString(),
      categoryId: plan.categoryId,
      month: plan.month,
      amountCents: plan.amountCents,
    })),
  });
});

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
    const amountCents = amountToCents(input.amount);
    if (!Number.isSafeInteger(amountCents)) {
      return c.json({ error: "Amount is too large" }, 400);
    }

    const userId = c.get("userId");
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
