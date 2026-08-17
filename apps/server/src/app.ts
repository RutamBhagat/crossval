import { auth } from "@crossval/auth";
import { env } from "@crossval/env/server";
import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";

import { actualsRoutes } from "./routes/actuals/index.js";
import { locksRoutes } from "./routes/locks/index.js";
import { plansRoutes } from "./routes/plans/index.js";
import { reportsRoutes } from "./routes/reports/index.js";

export const app = new Elysia({ adapter: node() })
  .onError(({ code, error }) => {
    if (code !== "VALIDATION" && code !== "PARSE" && code !== "NOT_FOUND") {
      console.error(error);
    }
  })
  .use(
    openapi({
      path: "/api/openapi",
      specPath: "/api/openapi/json",
      provider: "scalar",
      scalar: { url: "/api/openapi/json" },
      documentation: {
        info: { title: "Crossval API", version: "1.0.0" },
      },
    }),
  )
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .get("/", () => "OK")
  .group("/api", (api) =>
    api
      .get(
        "/health",
        () => ({ status: "ok" as const }),
        { response: { 200: t.Object({ status: t.Literal("ok") }) } },
      )
      .mount(auth.handler)
      .use(plansRoutes)
      .use(locksRoutes)
      .use(actualsRoutes)
      .use(reportsRoutes),
  );

export type App = typeof app;
