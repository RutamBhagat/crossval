import { Actual } from "@crossval/db/models/actual.model";
import { categories, getCategoryName } from "@crossval/domain/categories";
import { buildReportCsv, type ReportRow } from "@crossval/domain/report";
import { Elysia, t } from "elysia";

import { authPlugin } from "../../plugins/auth.js";
import { commonModels } from "../../schemas/common.js";
import {
  ReportActualsQuery,
  ReportActualsResponse,
  ReportExportQuery,
  ReportQuery,
  ReportResponse,
} from "./schema.js";

type ReportPage = {
  rows: ReportRow[];
  monthlyVariance: { month: string; varianceCents: number }[];
  metadata: { total: number }[];
};

const categoryNameBranches = categories.map((category) => ({
  case: { $eq: ["$_id.categoryId", category.id] },
  then: category.name,
}));

const reportsRoutes = new Elysia({ prefix: "/reports" })
  .use(commonModels)
  .use(authPlugin)
  .get(
    "/actuals",
    async ({ query, userId }) => {
      const actuals = await Actual.find({
        userId,
        categoryId: query.categoryId,
        month: query.month,
      })
        .sort({ _id: 1 })
        .lean();

      return {
        actuals: actuals.map((actual) => ({
          id: actual._id.toString(),
          amountCents: actual.amountCents,
          ...(actual.note ? { note: actual.note } : {}),
        })),
      };
    },
    {
      auth: true,
      query: ReportActualsQuery,
      response: {
        200: ReportActualsResponse,
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .get(
    "/export",
    async ({ query, set, status, userId }) => {
      if (query.start > query.end) {
        return status(400, {
          type: "invalid_range",
          message: "Report end month must be on or after start month",
        });
      }

      const month = { $gte: query.start, $lte: query.end };
      const sort: Record<string, 1 | -1> =
        query.sort === "category"
          ? { categoryName: query.direction, month: 1, categoryId: 1 }
          : query.sort === "target"
            ? { planCents: query.direction, month: 1, categoryId: 1 }
            : { month: query.direction, categoryId: 1 };

      const reports = await Actual.aggregate<ReportRow>([
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
              $switch: { branches: categoryNameBranches, default: "$_id.categoryId" },
            },
          },
        },
        {
          $set: {
            variancePercent: {
              $cond: [
                { $eq: ["$planCents", 0] },
                null,
                { $multiply: [{ $divide: ["$varianceCents", "$planCents"] }, 100] },
              ],
            },
          },
        },
        { $sort: sort },
        {
          $project: {
            _id: 0,
            categoryId: 1,
            month: 1,
            planCents: 1,
            actualCents: 1,
            varianceCents: 1,
            variancePercent: 1,
          },
        },
      ]);

      set.headers["Content-Disposition"] =
        `attachment; filename="variance-report-${query.start}-to-${query.end}.csv"`;
      set.headers["Content-Type"] = "text/csv; charset=utf-8";
      return buildReportCsv(reports, getCategoryName);
    },
    {
      auth: true,
      query: ReportExportQuery,
      response: {
        200: t.String(),
        400: "error.api",
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .get(
    "/",
    async ({ query, status, userId }) => {
      if (query.start > query.end) {
        return status(400, {
          type: "invalid_range",
          message: "Report end month must be on or after start month",
        });
      }

      const month = { $gte: query.start, $lte: query.end };
      const sort: Record<string, 1 | -1> =
        query.sort === "category"
          ? { categoryName: query.direction, month: 1, categoryId: 1 }
          : query.sort === "target"
            ? { planCents: query.direction, month: 1, categoryId: 1 }
            : { month: query.direction, categoryId: 1 };

      const [result] = await Actual.aggregate<ReportPage>([
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
              $switch: { branches: categoryNameBranches, default: "$_id.categoryId" },
            },
          },
        },
        {
          $set: {
            variancePercent: {
              $cond: [
                { $eq: ["$planCents", 0] },
                null,
                { $multiply: [{ $divide: ["$varianceCents", "$planCents"] }, 100] },
              ],
            },
          },
        },
        {
          $facet: {
            rows: [
              { $sort: sort },
              { $skip: query.offset },
              { $limit: query.limit },
              {
                $project: {
                  _id: 0,
                  categoryId: 1,
                  month: 1,
                  planCents: 1,
                  actualCents: 1,
                  varianceCents: 1,
                  variancePercent: 1,
                },
              },
            ],
            monthlyVariance: [
              { $group: { _id: "$month", varianceCents: { $sum: "$varianceCents" } } },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, month: "$_id", varianceCents: 1 } },
            ],
            metadata: [{ $count: "total" }],
          },
        },
      ]);

      return {
        reports: result?.rows ?? [],
        monthlyVariance: result?.monthlyVariance ?? [],
        total: result?.metadata[0]?.total ?? 0,
      };
    },
    {
      auth: true,
      query: ReportQuery,
      response: {
        200: ReportResponse,
        400: "error.api",
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  );

export { reportsRoutes };
