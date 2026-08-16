import { env } from "@crossval/env/server";
import Redis from "ioredis";

const redisClient = new Redis(env.REDIS_URL, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3_000,
  commandTimeout: 1_000,
});

redisClient.on("ready", () => {
  console.log("Redis client ready");
});

redisClient.on("close", () => {
  console.log("Redis client connection closed");
});

redisClient.on("error", (error) => {
  console.error("Redis client error", error);
});

export { redisClient };
