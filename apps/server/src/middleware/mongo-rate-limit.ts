import { client } from "@crossval/db";
import { env } from "@crossval/env/server";
import {
  RateLimiterMemory,
  RateLimiterMongo,
} from "rate-limiter-flexible";

import { createClientKey, createRateLimit } from "./rate-limit";

const POINTS = 120;
const DURATION_SECONDS = 60;
const BLOCK_DURATION_SECONDS = 60;

const insuranceLimiter = new RateLimiterMemory({
  points: POINTS,
  duration: DURATION_SECONDS,
  blockDuration: BLOCK_DURATION_SECONDS,
});

const mongoRateLimiter = new RateLimiterMongo({
  storeClient: client,
  tableName: "rate_limits",
  keyPrefix: "api",
  points: POINTS,
  duration: DURATION_SECONDS,
  blockDuration: BLOCK_DURATION_SECONDS,
  inMemoryBlockOnConsumed: POINTS + 1,
  inMemoryBlockDuration: BLOCK_DURATION_SECONDS,
  insuranceLimiter,
  disableIndexesCreation: true,
});

const rateLimit = createRateLimit({
  limiter: mongoRateLimiter,
  key: createClientKey(env.TRUSTED_PROXY_IP),
});

export { mongoRateLimiter, rateLimit };
