import { Actual } from "@crossval/db/models/actual.model";
import { categories, getCategoryName } from "@crossval/domain/categories";
import {
  buildReportCsv,
  type MonthlyVariance,
  type ReportRow,
} from "@crossval/domain/report";
import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import { requireAuth, type AuthVariables } from "@/middleware/auth";

import {
  reportActualsQuerySchema,
  reportExportQuerySchema,
  reportQuerySchema,
} from "./schema";

type ReportAggregation = {
  rows: ReportRow[];
  monthlyVariance: MonthlyVariance[];
  metadata: { total: number }[];
};

const reportsRouter = new Hono<{ Variables: AuthVariables }>();

type ReportSort = "month" | "category" | "target";
type ReportSortDirection = "ascending" | "descending";

const categoryNameBranches = categories.map((category) => ({
  case: { $eq: ["$_id.categoryId", category.id] },
  then: category.name,
}));

function reportRowsPipeline(userId: string, start: string, end: string) {
  const month = { $gte: start, $lte: end };

  return [
    { $match: { userId, month } },
    {
      $group: {
        _id: { categoryId: "$categoryId", month: "$month" },
        actualCents: { $sum: "$amountCents" },
      },
    },
    {
      $project: {
        _id: 0,
        categoryId: "$_id.categoryId",
        month: "$_id.month",
        planCents: { $literal: 0 },
        actualCents: 1,
      },
    },
    {
      $unionWith: {
        coll: "plans",
        pipeline: [
          { $match: { userId, month } },
          {
            $project: {
              _id: 0,
              categoryId: 1,
              month: 1,
              planCents: "$amountCents",
              actualCents: { $literal: 0 },
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: { categoryId: "$categoryId", month: "$month" },
        planCents: { $sum: "$planCents" },
        actualCents: { $sum: "$actualCents" },
      },
    },
    {
      $set: {
        categoryId: "$_id.categoryId",
        month: "$_id.month",
        varianceCents: { $subtract: ["$actualCents", "$planCents"] },
        categoryName: {
          $switch: {
            branches: categoryNameBranches,
            default: "$_id.categoryId",
          },
        },
      },
    },
    {
      $set: {
        variancePercent: {
          $cond: [
            { $eq: ["$planCents", 0] },
            null,
            {
              $multiply: [{ $divide: ["$varianceCents", "$planCents"] }, 100],
            },
          ],
        },
      },
    },
  ];
}

function reportSortStage(
  sort: ReportSort,
  direction: ReportSortDirection,
): { $sort: Record<string, 1 | -1> } {
  const value: 1 | -1 = direction === "ascending" ? 1 : -1;

  if (sort === "category") {
    return { $sort: { categoryName: value, month: 1, categoryId: 1 } };
  }
  if (sort === "target") {
    return { $sort: { planCents: value, month: 1, categoryId: 1 } };
  }
  return { $sort: { month: value, categoryId: 1 } };
}

const reportRowProjectStage = {
  $project: {
    _id: 0,
    categoryId: 1,
    month: 1,
    planCents: 1,
    actualCents: 1,
    varianceCents: 1,
    variancePercent: 1,
  },
};

async function loadReportRows(
  userId: string,
  start: string,
  end: string,
  sort: ReportSort,
  direction: ReportSortDirection,
) {
  return Actual.aggregate<ReportRow>([
    ...reportRowsPipeline(userId, start, end),
    reportSortStage(sort, direction),
    reportRowProjectStage,
  ]);
}

async function loadReportPage(
  userId: string,
  start: string,
  end: string,
  sort: ReportSort,
  direction: ReportSortDirection,
  offset: number,
  limit: number,
) {
  const [result] = await Actual.aggregate<ReportAggregation>([
    ...reportRowsPipeline(userId, start, end),
    {
      $facet: {
        rows: [
          reportSortStage(sort, direction),
          { $skip: offset },
          { $limit: limit },
          reportRowProjectStage,
        ],
        monthlyVariance: [
          {
            $group: {
              _id: "$month",
              varianceCents: { $sum: "$varianceCents" },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, month: "$_id", varianceCents: 1 } },
        ],
        metadata: [{ $count: "total" }],
      },
    },
  ]);

  return result ?? { rows: [], monthlyVariance: [], metadata: [] };
}

reportsRouter.use("*", requireAuth);

reportsRouter.get(
  "/actuals",
  sValidator("query", reportActualsQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error[0]?.message ?? "Invalid report row" },
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
  "/export",
  sValidator("query", reportExportQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error[0]?.message ?? "Invalid report range" },
        400,
      );
    }
  }),
  async (c) => {
    const { direction, end, sort, start } = c.req.valid("query");
    const reports = await loadReportRows(
      c.get("userId"),
      start,
      end,
      sort,
      direction,
    );
    const csv = buildReportCsv(reports, getCategoryName);

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="variance-report-${start}-to-${end}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  },
);

reportsRouter.get(
  "/",
  sValidator("query", reportQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error[0]?.message ?? "Invalid report range" },
        400,
      );
    }
  }),
  async (c) => {
    const { direction, end, limit, offset, sort, start } = c.req.valid("query");
    const { metadata, monthlyVariance, rows } = await loadReportPage(
      c.get("userId"),
      start,
      end,
      sort,
      direction,
      offset,
      limit,
    );

    return c.json({
      reports: rows,
      monthlyVariance,
      total: metadata[0]?.total ?? 0,
      offset,
      limit,
    });
  },
);

export { reportsRouter };
