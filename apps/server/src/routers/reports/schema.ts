import { type } from "arktype";

import { paginationQueryFields } from "@/pagination";
import { CategoryId, Month } from "@/validation";

const reportActualsQuerySchema = type({
  categoryId: CategoryId,
  month: Month,
});

const reportRangeFields = {
  start: Month,
  end: Month,
  sort: "'month' | 'category' | 'target' = 'month'",
  direction: "'ascending' | 'descending' = 'ascending'",
} as const;

const reportExportQuerySchema = type(reportRangeFields).narrow(
  ({ start, end }, ctx) =>
    start <= end
      ? true
      : ctx.reject({
          expected: "on or after start",
          actual: `before ${start}`,
          path: ["end"],
        }),
);

const reportQuerySchema = type({
  ...paginationQueryFields,
  ...reportRangeFields,
}).narrow(({ start, end }, ctx) =>
  start <= end
    ? true
    : ctx.reject({
        expected: "on or after start",
        actual: `before ${start}`,
        path: ["end"],
      }),
);

export { reportActualsQuerySchema, reportExportQuerySchema, reportQuerySchema };
