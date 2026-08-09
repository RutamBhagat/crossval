import { auth } from "@crossval/auth";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { handle } from "hono/vercel";

import { actualsRouter } from "@/server/routers/actuals";
import { locksRouter } from "@/server/routers/locks";
import { plansRouter } from "@/server/routers/plans";

const app = new Hono().basePath("/api");

app.use(logger());
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));
app.route("/actuals", actualsRouter);
app.route("/locks", locksRouter);
app.route("/plans", plansRouter);

app.get("/", (c) => {
  return c.text("OK");
});

export const DELETE = handle(app);
export const GET = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);
export const PATCH = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
