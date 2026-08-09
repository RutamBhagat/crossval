# Crossval

Crossval is a web application for monthly spending plans, actual spending, and variance reports.

## Prerequisites

Install these tools before you start:

- [Node.js](https://nodejs.org/) 20.9.0 or later
- [pnpm](https://pnpm.io/) 11.12.0
- [Docker](https://www.docker.com/) with Docker Compose

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

The local MongoDB database requires Docker. The example configuration uses this connection:

```text
mongodb://root:password@localhost:27017/crossval?authSource=admin
```

For production, you can replace the local database with MongoDB Atlas. Set `DATABASE_URL` to the MongoDB Atlas connection string.

To stop MongoDB, run:

```bash
pnpm db:stop
```

## Report behavior

### Missing actuals

The report treats a missing actual as zero. It shows `$0.00` in the Actual column and calculates the variance as `0 - Plan`. For example, a `$5,000.00` plan with no actual has a `-$5,000.00` variance and a `-100.00%` variance.

### Zero plan

The report shows `N/A` for the variance percentage when the plan is zero. This prevents division by zero. It still calculates the amount variance as `Actual - Plan`.

### Monthly locking

Locks apply to one calendar month and to one user. A locked month makes its plans and actuals read-only. The interface disables the related inputs, and the API rejects write requests with HTTP status `423` and a clear error message. The current version does not support unlocking a month.

## Assumptions and tradeoffs

- The application uses calendar months in `YYYY-MM` format. It does not support fiscal periods.
- All amounts use USD. The database stores nonnegative amounts as whole cents to prevent floating-point rounding errors.
- Marketing, Payroll, and Tools are a fixed seed list. Category CRUD is out of scope for this version.
- Each user can have one plan for each category and month. A user can add multiple actual entries, and the report adds them together.
- This version uses manual actual entry instead of CSV import.
- Locks cannot be removed. This keeps the first locking workflow small, but an administrator or controlled lock removal process would be necessary for corrections.

## Production improvements

Make these changes before production use:

- Add category management and CSV import.

- Add an audited lock removal process with clear user permissions.

- Add rate limits and stronger password controls.

- Add request logs, error monitoring, and service health checks.

- Use a managed MongoDB service with backups and recovery tests.

- Add more integration and browser tests for authentication and report workflows.

- Add pagination for long actual and report lists.

- Complete an accessibility and security review.

## Query approach at larger scale

The current schema has these main compound indexes:

- Plans: unique `{ userId, categoryId, month }` and report range `{ userId, month, categoryId }`
- Actuals: `{ userId, month, categoryId }`
- Period locks: unique `{ userId, month }`

Report requests filter by `userId` and a bounded month range in MongoDB. A MongoDB aggregation groups actual entries by month and category. The server joins these totals with the plans before it returns report rows. This prevents the browser from loading all entries for a user.

The unique plan index enforces one plan for each category and month. Long detail lists would use cursor pagination. Query execution plans and production metrics would determine whether more indexes are necessary.
