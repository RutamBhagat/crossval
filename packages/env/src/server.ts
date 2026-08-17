import "dotenv/config";
import { isIP } from "node:net";

import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

const NonEmptyString = v.pipe(v.string(), v.nonEmpty());
const Url = v.pipe(v.string(), v.url());
const CorsOrigin = v.optional(Url, "http://localhost:3000");
const Port = v.optional(
  v.pipe(
    v.string(),
    v.transform(Number),
    v.integer(),
    v.minValue(1),
    v.maxValue(65535),
  ),
  "8000",
);
const NodeEnv = v.optional(
  v.picklist(["development", "production", "test"]),
  "development",
);
const IpAddress = v.pipe(
  v.string(),
  v.check((value) => isIP(value) !== 0, "Expected an IP address"),
);
const TrustedProxyIp = v.optional(IpAddress, "10.0.0.21");

export const env = createEnv({
  server: {
    DATABASE_URL: NonEmptyString,
    UPSTASH_REDIS_REST_URL: Url,
    UPSTASH_REDIS_REST_TOKEN: NonEmptyString,
    BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(32)),
    BETTER_AUTH_URL: Url,
    GOOGLE_CLIENT_ID: NonEmptyString,
    GOOGLE_CLIENT_SECRET: NonEmptyString,
    CORS_ORIGIN: CorsOrigin,
    PORT: Port,
    NODE_ENV: NodeEnv,
    TRUSTED_PROXY_IP: TrustedProxyIp,
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
