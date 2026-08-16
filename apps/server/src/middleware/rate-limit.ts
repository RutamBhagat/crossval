import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  RateLimiterMemory,
  RateLimiterRes,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";

const DEFAULT_POINTS = 120;
const DEFAULT_DURATION_SECONDS = 60;
const DEFAULT_BLOCK_DURATION_SECONDS = 60;

type RateLimitOptions = {
  limiter?: RateLimiterAbstract;
  key?: (context: Context) => string | undefined;
  points?: number;
};

function getRemoteAddress(context: Context) {
  try {
    return getConnInfo(context).remote.address;
  } catch {
    // Unit tests and non-Node adapters do not provide connection information.
    return undefined;
  }
}

function createRateLimit(options: RateLimitOptions = {}) {
  const points = options.points ?? DEFAULT_POINTS;
  const limiter =
    options.limiter ??
    new RateLimiterMemory({
      points,
      duration: DEFAULT_DURATION_SECONDS,
      blockDuration: DEFAULT_BLOCK_DURATION_SECONDS,
    });
  const getKey = options.key ?? getRemoteAddress;

  return createMiddleware(async (context, next) => {
    const key = getKey(context);

    // The policy is fail-open when the runtime cannot provide a client address.
    if (!key) {
      return next();
    }

    try {
      const result = await limiter.consume(key);

      context.header("RateLimit-Limit", String(points));
      context.header("RateLimit-Remaining", String(result.remainingPoints));
      await next();
    } catch (error) {
      if (!(error instanceof RateLimiterRes)) {
        throw error;
      }

      const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));

      context.header("Retry-After", String(retryAfter));
      context.header("RateLimit-Limit", String(points));
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

const rateLimit = createRateLimit();

export { createRateLimit, rateLimit };
