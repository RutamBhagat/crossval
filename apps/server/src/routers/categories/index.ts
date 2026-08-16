import { categories } from "@crossval/domain/categories";
import { createAuthenticatedRouter } from "@/middleware/authenticated-router";

const categoriesRouter = createAuthenticatedRouter();

categoriesRouter.get("/", (c) => c.json({ categories }));

export { categoriesRouter };
