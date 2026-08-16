import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  RateLimiterRes,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";

type RateLimitOptions = {
  limiter: RateLimiterAbstract;
  key?: (context: Context) => string | undefined;
};

function getRemoteAddress(context: Context) {
  try {
    return getConnInfo(context).remote.address;
  } catch {
    // Unit tests and non-Node adapters do not provide connection information.
    return undefined;
  }
}

function createRateLimit(options: RateLimitOptions) {
  const { limiter } = options;
  const getKey = options.key ?? getRemoteAddress;

  return createMiddleware(async (context, next) => {
    const key = getKey(context);

    // The policy is fail-open when the runtime cannot provide a client address.
    if (!key) {
      return next();
    }

    try {
      const result = await limiter.consume(key);

      context.header("RateLimit-Limit", String(limiter.points));
      context.header("RateLimit-Remaining", String(result.remainingPoints));
      await next();
    } catch (error) {
      if (!(error instanceof RateLimiterRes)) {
        throw error;
      }

      const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));

      context.header("Retry-After", String(retryAfter));
      context.header("RateLimit-Limit", String(limiter.points));
      context.header("RateLimit-Remaining", "0");

      return context.json(
        {
          error: "rate_limit_exceeded",
          retryAfter,
        },
        429,
      );
    }
  });
}

export { createRateLimit };
