import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

const ApiOriginToken = v.pipe(
  v.string(),
  v.regex(
    /^[0-9a-f]{64}$/,
    "Expected a 64-character lowercase hexadecimal string",
  ),
);
const ApiUpstreamUrl = v.optional(
  v.pipe(v.string(), v.url()),
  "http://localhost:8000",
);

export const env = createEnv({
  server: {
    API_ORIGIN_TOKEN: ApiOriginToken,
    API_UPSTREAM_URL: ApiUpstreamUrl,
  },
  runtimeEnv: {
    API_ORIGIN_TOKEN: process.env.API_ORIGIN_TOKEN,
    API_UPSTREAM_URL: process.env.API_UPSTREAM_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
