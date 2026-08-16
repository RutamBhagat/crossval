import { env } from "@crossval/env/server";
import {
  RateLimiterMemory,
  RateLimiterRedis,
} from "rate-limiter-flexible";

import { redisClient } from "../redis";
import { createClientKey, createRateLimit } from "./rate-limit";

const POINTS = 120;
const DURATION_SECONDS = 60;
const BLOCK_DURATION_SECONDS = 60;

const insuranceLimiter = new RateLimiterMemory({
  points: POINTS,
  duration: DURATION_SECONDS,
  blockDuration: BLOCK_DURATION_SECONDS,
});

const redisRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "crossval:rl:api",
  points: POINTS,
  duration: DURATION_SECONDS,
  blockDuration: BLOCK_DURATION_SECONDS,
  rejectIfRedisNotReady: true,
  inMemoryBlockOnConsumed: POINTS + 1,
  inMemoryBlockDuration: BLOCK_DURATION_SECONDS,
  insuranceLimiter,
});

const rateLimit = createRateLimit({
  limiter: redisRateLimiter,
  key: createClientKey(env.TRUSTED_PROXY_IP),
  skip: (context) => context.req.path === "/api/health",
});

export { rateLimit, redisRateLimiter };
