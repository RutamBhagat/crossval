# Crossval

Crossval is a web application for monthly spending plans, actual spending, and variance reports.

## Prerequisites

Install these tools before you start:

- [Node.js](https://nodejs.org/) 20.9.0 or later
- [pnpm](https://pnpm.io/) 11.12.0
- [Docker](https://www.docker.com/) with Docker Compose

## Demo Video

[youtu.be/sgNpNzABpfw](https://youtu.be/sgNpNzABpfw)

## Live deployment

[crossval-web-five.vercel.app](https://crossval-web-five.vercel.app/)

Production stack:

- Vercel: Next.js frontend and backend
- MongoDB Atlas: production database

### Why Vercel instead of EC2

I chose Vercel because the frontend and backend are one Next.js application. The expected workload does not justify the cost of managing an EC2 instance. Vercel handles deployment and scaling. MongoDB Atlas supports the database transactions that the application requires.

The Docker Compose MongoDB configuration is only for local development.

## Local setup

1. Install the workspace dependencies from the project root:

   ```bash
   pnpm install
   ```
2. Copy the example environment files:

   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/server/.env.example apps/server/.env
   ```
3. Generate an authentication secret:

   ```bash
   openssl rand -base64 32
   ```
4. Replace `xxx` in `apps/server/.env` with the generated secret.
5. Start MongoDB:

   ```bash
   pnpm db:start
   ```
6. Start the web and server applications:

   ```bash
   pnpm dev
   ```
7. Open [http://localhost:3000](http://localhost:3000). The API listens on [http://localhost:8000](http://localhost:8000).

The local MongoDB database requires Docker. It runs as a single-node replica set because lock-safe writes use MongoDB transactions. The example configuration uses this connection:

```text
mongodb://localhost:27017/crossval?replicaSet=rs0
```

For production, you can replace the local database with MongoDB Atlas. Set `DATABASE_URL` to the MongoDB Atlas connection string.

To run the MongoDB integration tests, keep MongoDB running and use:

```bash
pnpm test:integration
```

The tests use the `crossval_integration` database by default. Set `INTEGRATION_DATABASE_URL` to use a different test replica set.

To stop MongoDB, run:

```bash
pnpm db:stop
```

## Report behavior

### Missing actuals

The report treats a missing actual as zero. It shows `$0.00` in the Actual column and calculates the variance as `0 - Plan`. For example, a `$5,000.00` plan with no actual has a `-$5,000.00` variance and a `-100.00%` variance.

### Zero or missing plan

The report includes actual spending that has no plan for the same category and month. It treats the missing plan as zero, so unplanned spending remains visible in the report, chart, and CSV export. The report omits category-month combinations that have no plan and no actual.

The report shows `N/A` for the variance percentage when the plan is zero or missing. This prevents division by zero. It still calculates the amount variance as `Actual - Plan`.

### Fiscal-year range

The report has previous and next fiscal-year controls, so no fixed year list requires maintenance. Fiscal years use the calendar year from January through December. A user can still select start and end months directly. The fiscal-year control then shows **Custom range**.

### Monthly locking

Locks apply to one calendar month and one user. A locked month makes its plans and actuals read-only. Plan saves, actual saves, and CSV imports use MongoDB transactions. Each transaction checks and updates the period state before it writes data. Closing a month updates the same period state. MongoDB serializes these updates, so a write cannot commit after a concurrent request closes its month.

The interface disables the related inputs. The API rejects writes with HTTP status `423` and a clear error message. The current version does not support unlocking a month.

### CSV export

Use **Export CSV** in the variance report to download all report rows in the selected date range. The export uses the selected table sort order and is not limited to the current page. Amounts use decimal USD values. A zero plan has `N/A` in the Variance % column.

## CSV import

Use **Import CSV** in the Actual spend card. The file must contain these headers:

```csv
month,category,amount
2026-01,Marketing,4800
```

The import checks the month, category, and amount in each row. The import accepts category names in any letter case. The API rejects the file if a row is invalid or uses a locked month.

## Assumptions and tradeoffs

- The application uses calendar months in `YYYY-MM` format. Fiscal years run from January through December. Custom fiscal-year start months are out of scope.
- All amounts use USD. The database stores nonnegative amounts as whole cents to prevent floating-point rounding errors.
- Marketing, Payroll, and Tools are a fixed seed list. Category CRUD is out of scope for this version.
- Each user can have one plan for each category and month. A user can add multiple actual entries, and the report adds them together.
- CSV import accepts one file at a time. It has no preview and rejects the full file if one row is invalid.
- Users cannot remove locks. An administrator or controlled lock removal process would be necessary for corrections.

## Production improvements

Make these changes before production use:

- Add category management, CSV previews, and import history.
- Add an audited lock removal process with clear user permissions.
- Add rate limits and stronger password controls.
- Add request logs, error monitoring, and service health checks.
- Configure and verify MongoDB Atlas backups. Test database recovery.
- Add more integration and browser tests for authentication and report workflows.
- Complete an accessibility and security review.

## Query approach at larger scale

The current schema has these main compound indexes:

- Plans: unique `{ userId, categoryId, month }` and report range `{ userId, month, categoryId }`
- Actuals: `{ userId, month, categoryId }`
- Period states: unique `{ userId, month }`

Report requests filter by `userId` and a bounded month range in MongoDB. One MongoDB aggregation groups actual entries, unions them with plans, joins category-month values, calculates variances, and sorts the result. A `$facet` stage returns only the requested page together with the total row count and monthly chart totals. The application does not load all report rows for a paginated request.

The dashboard plan, actual, and report lists use offset and limit pagination. The API limits each request to 50 rows. Report sorting supports month, category, and planned target. CSV export still reads all final report rows because the export contains the full selected range. Use query execution plans and production metrics to select more changes. These changes can include cursor pagination, export streaming, a reporting model, or more indexes.

## Tests

```bash
pnpm run test
$ pnpm --filter web test
$ vitest run

 RUN  v4.1.10 /Users/voldemort/Downloads/code/job-assignment/crossval/apps/web

 ✓ tests/report.test.ts (15 tests) 27ms
 ✓ tests/write-validation.test.ts (12 tests) 20ms
 ✓ tests/actual-import.test.ts (10 tests) 28ms
 ✓ tests/lock-enforcement.test.ts (5 tests) 27ms
 ✓ tests/api-access.test.ts (4 tests) 17ms

 ✓ tests/report.integration.test.ts (1 test) 732ms
     ✓ calculates report rows in MongoDB without leaking another user's data  447ms

 Test Files  6 passed (6)
      Tests  47 passed (47)
   Start at  00:42:04
   Duration  2.48s (transform 224ms, setup 0ms, import 3.41s, tests 851ms, environment 0ms)
```

```bash
pnpm run test:integration
$ pnpm --filter @crossval/db test:integration && pnpm --filter web test:integration
$ vitest run --config vitest.integration.config.mts

 RUN  v4.1.10 /Users/voldemort/Downloads/code/job-assignment/crossval/packages/db

 ✓ tests/period-state.integration.test.ts (4 tests) 285ms
   ✓ period-state transaction integration (4)
     ✓ rolls back the guard and does not write when one period is locked 28ms
     ✓ makes close wait for an in-flight guarded write, then leaves the period locked 120ms
     ✓ serializes the first guarded write with the first close 123ms
     ✓ rejects a guarded write after close commits 10ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  00:43:07
   Duration  467ms (transform 22ms, setup 9ms, import 114ms, tests 285ms, environment 0ms)

$ vitest run --config vitest.integration.config.mts

 RUN  v4.1.10 /Users/voldemort/Downloads/code/job-assignment/crossval/apps/web

 ✓ tests/report.integration.test.ts (1 test) 41ms
   ✓ report MongoDB aggregation integration (1)
     ✓ calculates report rows in MongoDB without leaking another user's data 38ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  00:43:08
   Duration  222ms (transform 30ms, setup 10ms, import 119ms, tests 41ms, environment 0ms)
```

```bash
pnpm check-types
$ pnpm -r check-types
Scope: 6 of 7 workspace projects
packages/ui check-types$ tsc --noEmit
└─ Done in 1.4s
apps/web check-types$ tsc --noEmit
└─ Done in 1.2s
```

```bash
pnpm build
$ pnpm -r build
Scope: 6 of 7 workspace projects
apps/web build$ next build
[14 lines collapsed]
│ Route (app)
│ ┌ ○ /
│ ├ ○ /_not-found
│ ├ ƒ /api/[[...route]]
│ ├ ƒ /dashboard
│ ├ ƒ /dashboard/periods
│ ├ ƒ /dashboard/reports
│ └ ○ /login
│ ○  (Static)   prerendered as static content
│ ƒ  (Dynamic)  server-rendered on demand
└─ Done in 8s
```
