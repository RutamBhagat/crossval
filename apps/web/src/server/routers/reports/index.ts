import { Actual } from "@crossval/db/models/actual.model";
import { Plan } from "@crossval/db/models/plan.model";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { getCategoryName } from "@/lib/categories";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";
import {
  buildMonthlyVariance,
  buildReportRows,
  type MonthlyActualTotal,
  type ReportRow,
} from "@/server/report";

import { reportActualsQuerySchema, reportQuerySchema } from "./schema";

type AggregatedActual = {
  _id: { categoryId: string; month: string };
  actualCents: number;
};

const reportsRouter = new Hono<{ Variables: AuthVariables }>();

reportsRouter.use("*", requireAuth);

reportsRouter.get(
  "/actuals",
  zValidator("query", reportActualsQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? "Invalid report row" },
        400,
      );
    }
  }),
  async (c) => {
    const { categoryId, month } = c.req.valid("query");
    const actuals = await Actual.find({
      userId: c.get("userId"),
      categoryId,
      month,
    })
      .sort({ _id: 1 })
      .lean();

    return c.json({
      actuals: actuals.map((actual) => ({
        id: actual._id.toString(),
        amountCents: actual.amountCents,
        note: actual.note,
      })),
    });
  },
);

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
    const { direction, end, limit, offset, sort, start } = c.req.valid("query");
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

    const reports = buildReportRows(plans, actualTotals);

    // Keep the unpaginated response for API clients that do not request a page.
    if (c.req.query("offset") === undefined && c.req.query("limit") === undefined) {
      return c.json({ reports });
    }

    const valueFor = (row: ReportRow) => {
      if (sort === "category") return getCategoryName(row.categoryId);
      if (sort === "target") return row.planCents;
      return row.month;
    };
    const sortedReports = [...reports].sort((left, right) => {
      const leftValue = valueFor(left);
      const rightValue = valueFor(right);
      const comparison =
        typeof leftValue === "string" && typeof rightValue === "string"
          ? leftValue.localeCompare(rightValue)
          : Number(leftValue) - Number(rightValue);

      if (comparison !== 0) {
        return direction === "ascending" ? comparison : -comparison;
      }

      return `${left.month}:${left.categoryId}`.localeCompare(
        `${right.month}:${right.categoryId}`,
      );
    });

    return c.json({
      reports: sortedReports.slice(offset, offset + limit),
      monthlyVariance: buildMonthlyVariance(reports),
      total: reports.length,
      offset,
      limit,
    });
  },
);

export { reportsRouter };
