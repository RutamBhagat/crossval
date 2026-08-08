import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

export const DELETE = handle(app);
export const GET = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);
export const PATCH = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
