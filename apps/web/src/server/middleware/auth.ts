import { auth } from "@crossval/auth";
import { createMiddleware } from "hono/factory";

type AuthVariables = {
  userId: string;
};

const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    c.set("userId", session.user.id);
    await next();
  },
);

export { requireAuth };
export type { AuthVariables };
