import { Actual } from "@crossval/db/models/actual.model";
import { runIfPeriodsOpen } from "@crossval/db/period-state";
import { categories } from "@crossval/domain/categories";
import { parse } from "csv-parse/sync";
import { Elysia } from "elysia";

import { authPlugin } from "../../plugins/auth.js";
import { commonModels } from "../../schemas/common.js";
import {
  ActualImportBody,
  ActualImportResponse,
  ActualInput,
  ActualSaveResponse,
  ActualsQuery,
  ActualsResponse,
} from "./schema.js";

const MAX_IMPORT_ROWS = 10_000;

const actualsRoutes = new Elysia({ prefix: "/actuals" })
  .use(commonModels)
  .use(authPlugin)
  .get(
    "/",
    async ({ query, userId }) => {
      const filter = { userId };
      const [actuals, total] = await Promise.all([
        Actual.find(filter)
          .sort({ [query.sort]: query.direction, _id: 1 })
          .skip(query.offset)
          .limit(query.limit)
          .lean(),
        Actual.countDocuments(filter),
      ]);

      return {
        actuals: actuals.map((actual) => ({
          id: actual._id.toString(),
          categoryId: actual.categoryId,
          month: actual.month,
          amountCents: actual.amountCents,
          ...(actual.note ? { note: actual.note } : {}),
        })),
        total,
      };
    },
    {
      auth: true,
      query: ActualsQuery,
      response: {
        200: ActualsResponse,
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .post(
    "/import",
    async ({ body, status, userId }) => {
      let records: string[][];
      try {
        records = parse(await body.file.text(), {
          bom: true,
          skip_empty_lines: true,
          trim: true,
          to: MAX_IMPORT_ROWS + 2,
        });
      } catch {
        return status(400, {
          type: "invalid_import",
          message: "CSV could not be parsed",
        });
      }

      if (records.length > MAX_IMPORT_ROWS + 1) {
        return status(400, {
          type: "invalid_import",
          message: `CSV cannot contain more than ${MAX_IMPORT_ROWS} rows`,
        });
      }

      const [headers, ...rows] = records;
      if (
        headers?.join(",").toLowerCase() !== "month,category,amount" ||
        rows.length === 0
      ) {
        return status(400, {
          type: "invalid_import",
          message: "CSV must contain month,category,amount headers and rows",
        });
      }

      const importedActuals: Array<{
        month: string;
        categoryId: string;
        amountCents: number;
      }> = [];

      for (const [index, values] of rows.entries()) {
        const [month, categoryName, amount] = values;
        const categoryId = categories.find(
          (category) => category.name.toLowerCase() === categoryName?.toLowerCase(),
        )?.id;
        const amountCents = Math.round(Number(amount) * 100);

        if (
          values.length !== 3 ||
          !month?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ||
          !categoryId ||
          !amount?.match(/^\d+(?:\.\d{1,2})?$/) ||
          !Number.isSafeInteger(amountCents)
        ) {
          return status(400, {
            type: "invalid_import",
            message: `Invalid CSV row ${index + 2}`,
          });
        }

        importedActuals.push({ month, categoryId, amountCents });
      }

      const months = [...new Set(importedActuals.map((actual) => actual.month))];
      const result = await runIfPeriodsOpen(userId, months, (session) =>
        Actual.insertMany(
          importedActuals.map((actual) => ({ ...actual, userId })),
          { session },
        ),
      );

      if (!result.ok) {
        return status(423, {
          type: "period_locked",
          message: "CSV contains actuals for a locked month",
        });
      }

      return status(201, { imported: importedActuals.length });
    },
    {
      auth: true,
      body: ActualImportBody,
      response: {
        201: ActualImportResponse,
        400: "error.api",
        401: "error.api",
        423: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .post(
    "/",
    async ({ body, status, userId }) => {
      const amountCents = Math.round(Number(body.amount) * 100);
      if (!Number.isSafeInteger(amountCents)) {
        return status(400, {
          type: "invalid_amount",
          message: "Amount is too large",
        });
      }

      const result = await runIfPeriodsOpen(
        userId,
        [body.month],
        async (session) => {
          const note = body.note?.trim();
          const actual = new Actual({
            userId,
            categoryId: body.categoryId,
            month: body.month,
            amountCents,
            ...(note ? { note } : {}),
          });
          await actual.save({ session });
          return actual;
        },
      );

      if (!result.ok) {
        return status(423, {
          type: "period_locked",
          message: `Actuals for ${body.month} are locked`,
        });
      }

      return status(201, {
        actual: {
          id: result.value._id.toString(),
          categoryId: result.value.categoryId,
          month: result.value.month,
          amountCents: result.value.amountCents,
          ...(result.value.note ? { note: result.value.note } : {}),
        },
      });
    },
    {
      auth: true,
      body: ActualInput,
      response: {
        201: ActualSaveResponse,
        400: "error.api",
        401: "error.api",
        423: "error.api",
        429: "error.rateLimit",
      },
    },
  );

export { actualsRoutes };
