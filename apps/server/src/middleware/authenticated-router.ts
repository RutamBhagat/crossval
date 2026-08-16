import { Hono, type MiddlewareHandler } from "hono";

import { requireAuth, type AuthVariables } from "./auth";
import { userRateLimit } from "./user-rate-limit";

type AuthenticatedEnv = { Variables: AuthVariables };

function createAuthenticatedRouter(
  rateLimit: MiddlewareHandler<AuthenticatedEnv> = userRateLimit,
) {
  const router = new Hono<AuthenticatedEnv>();
  router.use("*", requireAuth);
  router.use("*", rateLimit);
  return router;
}

export { createAuthenticatedRouter };
export type { AuthenticatedEnv };
