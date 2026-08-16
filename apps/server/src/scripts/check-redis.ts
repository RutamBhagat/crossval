import { env } from "@crossval/env/server";
import Redis from "ioredis";

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 3_000,
  commandTimeout: 1_000,
  maxRetriesPerRequest: 1,
});

try {
  await redis.connect();

  const response = await redis.ping();

  if (response !== "PONG") {
    throw new Error(`Unexpected Redis PING response: ${response}`);
  }

  console.log("Redis readiness check passed");
} finally {
  redis.disconnect();
}
