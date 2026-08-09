# Crossval

Crossval is a web application for monthly spending plans, actual spending, and variance reports.

## Prerequisites

Install these tools before you start:

- [Node.js](https://nodejs.org/) 20.9.0 or later
- [pnpm](https://pnpm.io/) 11.12.0
- [Docker](https://www.docker.com/) with Docker Compose

## Live deployment

https://crossval-web-five.vercel.app/

Production stack:

- Vercel — Next.js application
- MongoDB Atlas — production database

The Docker Compose MongoDB configuration is only for local development.

## Local setup

1. Install the workspace dependencies from the project root:

   ```bash
   pnpm install
   ```

2. Copy the example environment file:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. Generate an authentication secret:

   ```bash
   openssl rand -base64 32
   ```

4. Replace `xxx` in `apps/web/.env` with the generated secret.

5. Start MongoDB:

   ```bash
   pnpm db:start
   ```

6. Start the web application:

   ```bash
   pnpm dev:web
   ```

7. Open [http://localhost:3000](http://localhost:3000).

The local MongoDB database requires Docker. It runs as a single-node replica set because lock-safe writes use MongoDB transactions. The example configuration uses this connection:

```text
mongodb://localhost:27017/crossval?replicaSet=rs0
```

For production, you can replace the local database with MongoDB Atlas. Set `DATABASE_URL` to the MongoDB Atlas connection string.

To stop MongoDB, run:

```bash
pnpm db:stop
```

## Report behavior

### Missing actuals

The report treats a missing actual as zero. It shows `$0.00` in the Actual column and calculates the variance as `0 - Plan`. For example, a `$5,000.00` plan with no actual has a `-$5,000.00` variance and a `-100.00%` variance.

### Zero or missing plan

The report includes actual spending that has no plan for the same category and month. It treats the missing plan as zero, so unplanned spending remains visible in the report, chart, and CSV export. Category-month combinations with no plan and no actual are not shown.

The report shows `N/A` for the variance percentage when the plan is zero or missing. This prevents division by zero. It still calculates the amount variance as `Actual - Plan`.

### Fiscal-year range

The report has previous and next fiscal-year controls, so no fixed year list requires maintenance. Fiscal years use the calendar year from January through December. A user can still select start and end months directly; the fiscal-year control then shows **Custom range**.

### Monthly locking

Locks apply to one calendar month and to one user. A locked month makes its plans and actuals read-only. The lock state and each plan, actual, or CSV write use the same MongoDB transaction guard. Thus, a write cannot commit after a concurrent request closes its month. The interface disables the related inputs, and the API rejects write requests with HTTP status `423` and a clear error message. The current version does not support unlocking a month.

### CSV export

Use **Export CSV** in the variance report to download all report rows in the selected date range. The export uses the selected table sort order and is not limited to the current page. Amounts use decimal USD values. A zero plan has `N/A` in the Variance % column.

## CSV import

Use **Import CSV** in the Actual spend card. The file must contain these headers:

```csv
month,category,amount
2026-01,Marketing,4800
```

The import checks the month, category, and amount in each row. Category names are not case-sensitive. The API rejects the file if a row is invalid or uses a locked month.

## Assumptions and tradeoffs

- The application uses calendar months in `YYYY-MM` format. Fiscal years run from January through December; custom fiscal-year start months are out of scope.
- All amounts use USD. The database stores nonnegative amounts as whole cents to prevent floating-point rounding errors.
- Marketing, Payroll, and Tools are a fixed seed list. Category CRUD is out of scope for this version.
- Each user can have one plan for each category and month. A user can add multiple actual entries, and the report adds them together.
- CSV import accepts one file at a time. It does not provide a preview or partial-row import.
- Locks cannot be removed. This keeps the first locking workflow small, but an administrator or controlled lock removal process would be necessary for corrections.

## Production improvements

Make these changes before production use:

- Add category management, CSV previews, and import history.

- Add an audited lock removal process with clear user permissions.

- Add rate limits and stronger password controls.

- Add request logs, error monitoring, and service health checks.

- Use a managed MongoDB service with backups and recovery tests.

- Add more integration and browser tests for authentication and report workflows.

- Complete an accessibility and security review.

## Query approach at larger scale

The current schema has these main compound indexes:

- Plans: unique `{ userId, categoryId, month }` and report range `{ userId, month, categoryId }`
- Actuals: `{ userId, month, categoryId }`
- Period states: unique `{ userId, month }`

Report requests filter by `userId` and a bounded month range in MongoDB. A MongoDB aggregation groups actual entries by month and category. The server joins these totals with the plans before it returns report rows. This prevents the browser from loading all entries for a user.

The dashboard plan, actual, and report lists use offset and limit pagination. The API limits each request to 50 rows. Report sorting supports month, category, and planned target. Query execution plans and production metrics would determine whether cursor pagination or more indexes are necessary.
