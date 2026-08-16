import { createRateLimit } from "./rate-limit";
import { redisUserRateLimiter } from "./redis-rate-limit";

const userRateLimit = createRateLimit({
  limiter: redisUserRateLimiter,
  policy: "user",
  key: (context) => context.get("userId"),
});

export { userRateLimit };
