import { Actual } from "@crossval/db/models/actual.model";
import { runIfPeriodsOpen } from "@crossval/db/period-state";
import { zValidator } from "@hono/zod-validator";
import { parse } from "csv-parse/sync";
import { Hono } from "hono";

import { categories } from "@/lib/categories";
import { amountToCents } from "@/server/money";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

import { actualInputSchema, actualsQuerySchema } from "./schema";

const actualsRouter = new Hono<{ Variables: AuthVariables }>();
const categoryIdsByName = new Map(
  categories.map((category) => [category.name.toLowerCase(), category.id]),
);

actualsRouter.use("*", requireAuth);

actualsRouter.get(
  "/",
  zValidator("query", actualsQuerySchema, (result, c) => {
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
      note: "note",
      amount: "amountCents",
    } as const;
    const sortDirection = direction === "ascending" ? 1 : -1;
    const databaseSort: Record<string, 1 | -1> = {
      [sortFields[sort]]: sortDirection,
      _id: 1,
    };
    const [actuals, total] = await Promise.all([
      Actual.find(filter).sort(databaseSort).skip(offset).limit(limit).lean(),
      Actual.countDocuments(filter),
    ]);

    return c.json({
      actuals: actuals.map((actual) => ({
        id: actual._id.toString(),
        categoryId: actual.categoryId,
        month: actual.month,
        amountCents: actual.amountCents,
        note: actual.note,
      })),
      total,
      offset,
      limit,
    });
  },
);

actualsRouter.post("/import", async (c) => {
  const file = (await c.req.parseBody()).file;
  if (!(file instanceof File)) {
    return c.json({ error: "Select a CSV file to import" }, 400);
  }

  let records: string[][];
  try {
    records = parse(await file.text(), {
      bom: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return c.json({ error: "CSV could not be parsed" }, 400);
  }

  const [headers, ...rows] = records;
  if (
    headers?.join(",").toLowerCase() !== "month,category,amount" ||
    rows.length === 0
  ) {
    return c.json(
      { error: "CSV must contain month,category,amount headers and rows" },
      400,
    );
  }

  const importedActuals: Array<{
    month: string;
    categoryId: string;
    amountCents: number;
  }> = [];
  for (const [index, values] of rows.entries()) {
    const [month, categoryName, amount] = values;
    const categoryId = categoryName
      ? categoryIdsByName.get(categoryName.toLowerCase())
      : undefined;

    if (
      values.length !== 3 ||
      !month?.match(/^\d{4}-(0[1-9]|1[0-2])$/) ||
      !categoryId ||
      !amount?.match(/^\d+(?:\.\d{1,2})?$/)
    ) {
      return c.json({ error: `Invalid CSV row ${index + 2}` }, 400);
    }

    const amountCents = amountToCents(amount);
    if (!Number.isSafeInteger(amountCents)) {
      return c.json({ error: `Invalid CSV row ${index + 2}` }, 400);
    }

    importedActuals.push({ month, categoryId, amountCents });
  }

  const userId = c.get("userId");
  const months = [...new Set(importedActuals.map((actual) => actual.month))];
  const result = await runIfPeriodsOpen(userId, months, (session) =>
    Actual.insertMany(
      importedActuals.map((actual) => ({ ...actual, userId })),
      { session },
    ),
  );

  if (!result.ok) {
    return c.json({ error: "CSV contains actuals for a locked month" }, 423);
  }

  return c.json({ imported: importedActuals.length }, 201);
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
    const userId = c.get("userId");
    const amountCents = amountToCents(input.amount);
    if (!Number.isSafeInteger(amountCents)) {
      return c.json({ error: "Amount is too large" }, 400);
    }

    const result = await runIfPeriodsOpen(
      userId,
      [input.month],
      async (session) => {
        const [actual] = await Actual.create(
          [
            {
              userId,
              categoryId: input.categoryId,
              month: input.month,
              amountCents,
              note: input.note || undefined,
            },
          ],
          { session },
        );
        return actual;
      },
    );

    if (!result.ok) {
      return c.json({ error: `Actuals for ${input.month} are locked` }, 423);
    }

    const actual = result.value;
    if (!actual) {
      return c.json({ error: "Actual could not be saved" }, 500);
    }

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
