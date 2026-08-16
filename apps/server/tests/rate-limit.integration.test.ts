import { randomUUID } from "node:crypto";

import { RateLimiterRedis } from "rate-limiter-flexible";
import { afterEach, describe, expect, it } from "vitest";

import { redisRateLimiter } from "../src/middleware/redis-rate-limit";
import { redisClient } from "../src/redis";

const keys = new Set<string>();

function testKey() {
  const key = `rate-limit-integration-${randomUUID()}`;
  keys.add(key);
  return key;
}

describe("Redis rate limiter integration", () => {
  afterEach(async () => {
    await Promise.all([...keys].map((key) => redisRateLimiter.delete(key)));
    keys.clear();
  });

  it("shares counters between limiter instances", async () => {
    const key = testKey();
    const secondLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "api",
      points: 120,
      duration: 60,
      blockDuration: 60,
    });

    const first = await redisRateLimiter.consume(key);
    const second = await secondLimiter.consume(key);

    expect(first.consumedPoints).toBe(1);
    expect(second.consumedPoints).toBe(2);
    expect(second.remainingPoints).toBe(118);
  });

  it("resets an expired counter", async () => {
    const key = testKey();
    const storeKey = redisRateLimiter.getKey(key);

    await redisRateLimiter.consume(key);
    await redisClient.pexpire(storeKey, 1);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = await redisRateLimiter.consume(key);

    expect(result.consumedPoints).toBe(1);
    expect(result.remainingPoints).toBe(119);
  });

  it("sets an expiry on counters", async () => {
    const key = testKey();

    await redisRateLimiter.consume(key);

    expect(await redisClient.pttl(redisRateLimiter.getKey(key))).toBeGreaterThan(0);
  });
});
