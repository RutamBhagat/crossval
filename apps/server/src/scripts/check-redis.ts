import { createRateLimit, redis } from "../rate-limit.js";

const ping = await redis.ping();
if (ping !== "PONG") {
  throw new Error(`Upstash Redis readiness check failed: ${ping}`);
}

const limiter = createRateLimit("crossval:deploy-check");
const identifier = `deploy:${process.pid}:${Date.now()}`;
const result = await limiter.limit(identifier);

if (!result.success || result.reason === "timeout") {
  throw new Error(
    `Upstash rate-limit readiness check failed${result.reason ? `: ${result.reason}` : ""}`,
  );
}

await limiter.resetUsedTokens(identifier);
console.log("Upstash Redis readiness check passed");
