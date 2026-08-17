import { auth } from "@crossval/auth";
import { Elysia } from "elysia";

import { getClientRateLimitKey } from "../client-ip.js";
import { getRetryAfter, ipRateLimit, userRateLimit } from "../rate-limit.js";

const authPlugin = new Elysia({ name: "auth" }).macro({
  auth: {
    async resolve({ request, set, status }) {
      const ipResult = await ipRateLimit.limit(getClientRateLimitKey(request));
      if (!ipResult.success) {
        const retryAfter = getRetryAfter(ipResult.reset);
        set.headers["Retry-After"] = String(retryAfter);
        return status(429, {
          type: "rate_limit_exceeded",
          message: "Rate limit exceeded",
          policy: "ip" as const,
          retryAfter,
        });
      }

      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user) {
        return status(401, {
          type: "unauthorized",
          message: "Authentication required",
        });
      }

      const result = await userRateLimit.limit(session.user.id);
      if (!result.success) {
        const retryAfter = getRetryAfter(result.reset);
        set.headers["Retry-After"] = String(retryAfter);
        return status(429, {
          type: "rate_limit_exceeded",
          message: "Rate limit exceeded",
          policy: "user" as const,
          retryAfter,
        });
      }

      return { userId: session.user.id };
    },
  },
});

export { authPlugin };
