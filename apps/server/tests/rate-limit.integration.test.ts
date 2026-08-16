import { randomUUID } from "node:crypto";

import { RateLimiterRedis } from "rate-limiter-flexible";
import { afterEach, describe, expect, it } from "vitest";

import app from "../src/index";
import {
  IP_RATE_LIMIT_POINTS,
  USER_RATE_LIMIT_POINTS,
  redisRateLimiter,
  redisUserRateLimiter,
} from "../src/middleware/redis-rate-limit";
import { redisClient } from "../src/redis";

const keys = new Set<string>();

function testKey() {
  const key = `rate-limit-integration-${randomUUID()}`;
  keys.add(key);
  return key;
}

describe("Redis rate limiter integration", () => {
  afterEach(async () => {
    await Promise.all(
      [...keys].flatMap((key) => [
        redisRateLimiter.delete(key),
        redisUserRateLimiter.delete(key),
      ]),
    );
    keys.clear();
  });

  it("excludes the actual health route", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.has("RateLimit-Limit")).toBe(false);
    expect(response.headers.has("RateLimit-Remaining")).toBe(false);
  });

  it("shares counters between limiter instances", async () => {
    const key = testKey();
    const secondLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "crossval:rl:api",
      points: IP_RATE_LIMIT_POINTS,
      duration: 60,
      blockDuration: 60,
    });

    const first = await redisRateLimiter.consume(key);
    const second = await secondLimiter.consume(key);

    expect(first.consumedPoints).toBe(1);
    expect(second.consumedPoints).toBe(2);
    expect(second.remainingPoints).toBe(IP_RATE_LIMIT_POINTS - 2);
  });

  it("keeps IP and authenticated-user counters independent", async () => {
    const key = testKey();

    const ipResult = await redisRateLimiter.consume(key);
    const userResult = await redisUserRateLimiter.consume(key);

    expect(ipResult.consumedPoints).toBe(1);
    expect(ipResult.remainingPoints).toBe(IP_RATE_LIMIT_POINTS - 1);
    expect(userResult.consumedPoints).toBe(1);
    expect(userResult.remainingPoints).toBe(USER_RATE_LIMIT_POINTS - 1);
    expect(redisRateLimiter.getKey(key)).not.toBe(
      redisUserRateLimiter.getKey(key),
    );
  });

  it("resets an expired counter", async () => {
    const key = testKey();
    const storeKey = redisRateLimiter.getKey(key);

    await redisRateLimiter.consume(key);
    await redisClient.pexpire(storeKey, 1);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = await redisRateLimiter.consume(key);

    expect(result.consumedPoints).toBe(1);
    expect(result.remainingPoints).toBe(IP_RATE_LIMIT_POINTS - 1);
  });

  it("sets an expiry on counters", async () => {
    const key = testKey();

    await redisRateLimiter.consume(key);

    expect(await redisClient.pttl(redisRateLimiter.getKey(key))).toBeGreaterThan(0);
  });
});
