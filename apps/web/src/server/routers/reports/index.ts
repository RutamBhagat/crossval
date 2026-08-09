import { Actual } from "@crossval/db/models/actual.model";
import { Plan } from "@crossval/db/models/plan.model";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireAuth, type AuthVariables } from "@/server/middleware/auth";
import {
  buildReportRows,
  type MonthlyActualTotal,
} from "@/server/report";

import { reportQuerySchema } from "./schema";

type AggregatedActual = {
  _id: { categoryId: string; month: string };
  actualCents: number;
};

const reportsRouter = new Hono<{ Variables: AuthVariables }>();

reportsRouter.use("*", requireAuth);

reportsRouter.get(
  "/",
  zValidator("query", reportQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid report range" },
        400,
      );
    }
  }),
  async (c) => {
    const { start, end } = c.req.valid("query");
    const userId = c.get("userId");
    const month = { $gte: start, $lte: end };

    const [plans, aggregatedActuals] = await Promise.all([
      Plan.find({ userId, month })
        .sort({ month: -1, categoryId: 1 })
        .lean(),
      Actual.aggregate<AggregatedActual>([
        { $match: { userId, month } },
        {
          $group: {
            _id: { categoryId: "$categoryId", month: "$month" },
            actualCents: { $sum: "$amountCents" },
          },
        },
      ]),
    ]);

    const actualTotals: MonthlyActualTotal[] = aggregatedActuals.map(
      (actual) => ({
        categoryId: actual._id.categoryId,
        month: actual._id.month,
        actualCents: actual.actualCents,
      }),
    );

    return c.json({ reports: buildReportRows(plans, actualTotals) });
  },
);

export { reportsRouter };
