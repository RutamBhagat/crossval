import { Actual } from "@crossval/db/models/actual.model";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { amountToCents } from "@/server/money";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

import { actualInputSchema } from "./schema";

const actualsRouter = new Hono<{ Variables: AuthVariables }>();

actualsRouter.use("*", requireAuth);

actualsRouter.get("/", async (c) => {
  const actuals = await Actual.find({ userId: c.get("userId") })
    .sort({ month: -1, categoryId: 1, createdAt: 1 })
    .lean();

  return c.json({
    actuals: actuals.map((actual) => ({
      id: actual._id.toString(),
      categoryId: actual.categoryId,
      month: actual.month,
      amountCents: actual.amountCents,
      note: actual.note,
    })),
  });
});

actualsRouter.post(
  "/",
  zValidator("json", actualInputSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid actual" },
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

    const actual = await Actual.create({
      userId: c.get("userId"),
      categoryId: input.categoryId,
      month: input.month,
      amountCents,
      note: input.note || undefined,
    });

    return c.json(
      {
        actual: {
          id: actual._id.toString(),
          categoryId: actual.categoryId,
          month: actual.month,
          amountCents: actual.amountCents,
          note: actual.note,
        },
      },
      201,
    );
  },
);

export { actualsRouter };
