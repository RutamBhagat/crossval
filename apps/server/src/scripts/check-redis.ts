import { env } from "@crossval/env/server";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 3_000,
  commandTimeout: 1_000,
  maxRetriesPerRequest: 1,
});

try {
  await redis.connect();

  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "crossval:deploy-check",
    points: 1,
    duration: 10,
    rejectIfRedisNotReady: true,
  });
  const key = `${process.pid}:${Date.now()}`;

  await limiter.consume(key);
  await limiter.delete(key);

  console.log("Redis readiness check passed");
} finally {
  redis.disconnect();
}
