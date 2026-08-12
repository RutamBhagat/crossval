import { categories } from "@crossval/domain/categories";
import { Hono } from "hono";

import { requireAuth, type AuthVariables } from "@/middleware/auth";

const categoriesRouter = new Hono<{ Variables: AuthVariables }>();

categoriesRouter.use("*", requireAuth);

categoriesRouter.get("/", (c) => c.json({ categories }));

export { categoriesRouter };
