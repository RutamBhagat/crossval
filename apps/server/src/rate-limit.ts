import { env } from "@crossval/env/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const USER_RATE_LIMIT_MAX = 300;

function createRateLimit(prefix: string, max = USER_RATE_LIMIT_MAX) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, "1 m"),
    prefix,
  });
}

function getRetryAfter(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

const userRateLimit = createRateLimit("crossval:rl:user", USER_RATE_LIMIT_MAX);

export { createRateLimit, getRetryAfter, redis, userRateLimit };
