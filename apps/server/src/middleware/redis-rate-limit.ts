import { env } from "@crossval/env/server";
import {
  RateLimiterMemory,
  RateLimiterRedis,
} from "rate-limiter-flexible";

import { redisClient } from "../redis";
import { createClientKey, createRateLimit } from "./rate-limit";

const IP_RATE_LIMIT_POINTS = 3000;
const USER_RATE_LIMIT_POINTS = 300;
const DURATION_SECONDS = 60;
const BLOCK_DURATION_SECONDS = 60;

function createRedisLimiter(keyPrefix: string, points: number) {
  const insuranceLimiter = new RateLimiterMemory({
    points,
    duration: DURATION_SECONDS,
    blockDuration: BLOCK_DURATION_SECONDS,
  });

  return new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix,
    points,
    duration: DURATION_SECONDS,
    blockDuration: BLOCK_DURATION_SECONDS,
    rejectIfRedisNotReady: true,
    inMemoryBlockOnConsumed: points + 1,
    inMemoryBlockDuration: BLOCK_DURATION_SECONDS,
    insuranceLimiter,
  });
}

const redisRateLimiter = createRedisLimiter(
  "crossval:rl:api",
  IP_RATE_LIMIT_POINTS,
);
const redisUserRateLimiter = createRedisLimiter(
  "crossval:rl:user",
  USER_RATE_LIMIT_POINTS,
);

const rateLimit = createRateLimit({
  limiter: redisRateLimiter,
  policy: "ip",
  key: createClientKey(env.TRUSTED_PROXY_IP),
  skip: (context) => context.req.path === "/api/health",
});

export {
  IP_RATE_LIMIT_POINTS,
  USER_RATE_LIMIT_POINTS,
  rateLimit,
  redisRateLimiter,
  redisUserRateLimiter,
};
