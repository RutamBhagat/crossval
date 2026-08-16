import { randomUUID } from "node:crypto";

import { client } from "@crossval/db";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { beforeAll, afterEach, describe, expect, it } from "vitest";

import { mongoRateLimiter } from "../src/middleware/mongo-rate-limit";

const keys = new Set<string>();

function testKey() {
  const key = `rate-limit-integration-${randomUUID()}`;
  keys.add(key);
  return key;
}

describe("MongoDB rate limiter integration", () => {
  beforeAll(async () => {
    await mongoRateLimiter.createIndexes();
  });

  afterEach(async () => {
    await Promise.all([...keys].map((key) => mongoRateLimiter.delete(key)));
    keys.clear();
  });


  it("shares counters between limiter instances", async () => {
    const key = testKey();
    const secondLimiter = new RateLimiterMongo({
      storeClient: client,
      tableName: "rate_limits",
      keyPrefix: "api",
      points: 120,
      duration: 60,
      blockDuration: 60,
      disableIndexesCreation: true,
    });

    const first = await mongoRateLimiter.consume(key);
    const second = await secondLimiter.consume(key);

    expect(first.consumedPoints).toBe(1);
    expect(second.consumedPoints).toBe(2);
    expect(second.remainingPoints).toBe(118);
  });

  it("resets an expired counter before TTL cleanup", async () => {
    const key = testKey();

    await mongoRateLimiter.consume(key);
    await client.collection("rate_limits").updateOne(
      { key: mongoRateLimiter.getKey(key) },
      { $set: { expire: new Date(0) } },
    );

    const result = await mongoRateLimiter.consume(key);

    expect(result.consumedPoints).toBe(1);
    expect(result.remainingPoints).toBe(119);
  });

  it("creates unique key and TTL indexes", async () => {
    const indexes = await client.collection("rate_limits").indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: { expire: -1 }, expireAfterSeconds: 0 }),
        expect.objectContaining({ key: { key: 1 }, unique: true }),
      ]),
    );
  });
});
