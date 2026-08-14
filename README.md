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

### Frontend

[crossval-web-five.vercel.app](https://crossval-web-five.vercel.app/)

### Backend

[92.5.160.137/crossval](https://92.5.160.137/crossval)

Production stack:

- Vercel: Next.js frontend
- Oracle Cloud Infrastructure (OCI): Hono API on a compute instance
- MongoDB Atlas: production database

### Deployment architecture

The frontend and API are separate applications. Vercel runs `apps/web` and rewrites same-origin `/api/*` requests to the OCI API. The `API_UPSTREAM_URL` environment variable sets this upstream URL.

The OCI instance runs the built `apps/server` application as a systemd service on port `8000`. MongoDB Atlas supports the transactions that enforce month locks.

A push to `main` starts the OCI deployment workflow. GitHub Actions checks the server types, runs its tests, and builds it before deployment. The workflow uploads a source archive, installs a versioned release under `/opt/crossval/releases`, and switches the `current` symlink. It checks `/api/health` after restart and restores the prior release if the check fails.

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
4. Create a Google OAuth 2.0 client for a web application in Google Cloud Console.
5. Add this authorized JavaScript origin:

   ```text
   http://localhost:3000
   ```
6. Add this authorized redirect URI:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```
7. Set `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `apps/server/.env`.
8. Start MongoDB:

   ```bash
   pnpm db:start
   ```
9. Start the web and server applications:

   ```bash
   pnpm dev
   ```
10. Open [http://localhost:3000](http://localhost:3000). The API listens on [http://localhost:8000](http://localhost:8000).

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

### Authentication

Crossval supports Google OAuth only. It does not support email and password authentication or magic links.

This choice reduces the authentication code and sensitive credential data that Crossval must manage. Google verifies the email address. It also manages passwords, multi-factor authentication, account recovery, and abuse controls. Crossval does not need password storage or password reset flows. It also does not need verification email delivery through Amazon SES, Resend, or another provider. Google sign-in reduces friction for users who already have a Google account.

Google OAuth is not inherently secure in every deployment. It reduces the application-controlled authentication surface by delegating credential security to Google. Crossval must still protect OAuth secrets, redirect URIs, sessions, cookies, and user authorization.

The main tradeoff is provider dependence. Every user must have a Google account, and sign-in depends on Google availability and policy. Crossval cannot control Google account recovery. This choice can also exclude users or organizations that do not permit Google accounts.

Supporting local credentials later would require email verification, password reset, rate limits, anti-enumeration controls, secure account linking, and transactional email delivery.

### Product and data model

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
- Add rate limits and review OAuth, session, cookie, and token-revocation controls.
- Add centralized request logs, error monitoring, and external health monitoring.
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

Run the server unit tests:

```bash
pnpm test
```

Run the database and server integration tests while the local MongoDB replica set is active:

```bash
pnpm test:integration
```

Check all workspace types:

```bash
pnpm check-types
```

Build the Next.js frontend and Hono server:

```bash
pnpm build
```
