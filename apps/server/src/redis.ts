import { env } from "@crossval/env/server";
import Redis from "ioredis";

const redisClient = new Redis(env.REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redisClient.on("error", (error) => {
  console.error("Redis client error", error);
});

export { redisClient };
