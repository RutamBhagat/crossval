import "@/validation-config";

import { auth } from "@crossval/auth";
import { env } from "@crossval/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { actualsRouter } from "@/routers/actuals";
import { categoriesRouter } from "@/routers/categories";
import { locksRouter } from "@/routers/locks";
import { plansRouter } from "@/routers/plans";
import { rateLimit } from "@/middleware/rate-limit";
import { reportsRouter } from "@/routers/reports";

const app = new Hono().basePath("/api");

app.use(logger());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use("*", rateLimit);
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));
app.route("/actuals", actualsRouter);
app.route("/categories", categoriesRouter);
app.route("/locks", locksRouter);
app.route("/plans", plansRouter);
app.route("/reports", reportsRouter);

app.get("/health", (c) => c.json({ status: "ok" }));

export { app };
export default app;
