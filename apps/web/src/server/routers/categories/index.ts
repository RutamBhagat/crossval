import { Hono } from "hono";

import { categories } from "@/lib/categories";
import { requireAuth, type AuthVariables } from "@/server/middleware/auth";

const categoriesRouter = new Hono<{ Variables: AuthVariables }>();

categoriesRouter.use("*", requireAuth);

categoriesRouter.get("/", (c) => c.json({ categories }));

export { categoriesRouter };
