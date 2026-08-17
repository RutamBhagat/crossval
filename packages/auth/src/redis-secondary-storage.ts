import { env } from "@crossval/env/server";
import { Redis } from "@upstash/redis";
import type { SecondaryStorage } from "better-auth";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const KEY_PREFIX = "crossval:better-auth:";
const INCREMENT_WITH_TTL = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

const storageKey = (key: string) => `${KEY_PREFIX}${key}`;
const asString = (value: unknown) =>
  value == null ? null : typeof value === "string" ? value : JSON.stringify(value);

const redisSecondaryStorage: SecondaryStorage = {
  async get(key) {
    return asString(await redis.get(storageKey(key)));
  },
  async getAndDelete(key) {
    return asString(await redis.getdel(storageKey(key)));
  },
  async set(key, value, ttl) {
    if (ttl) {
      await redis.set(storageKey(key), value, { ex: ttl });
      return;
    }
    await redis.set(storageKey(key), value);
  },
  async delete(key) {
    await redis.del(storageKey(key));
  },
  async increment(key, ttl) {
    const count = await redis.eval(
      INCREMENT_WITH_TTL,
      [storageKey(key)],
      [String(ttl)],
    );
    return Number(count);
  },
};

export { redisSecondaryStorage };
