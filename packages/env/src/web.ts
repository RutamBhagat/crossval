import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

const ApiUpstreamUrl = v.optional(
  v.pipe(v.string(), v.url()),
  "http://localhost:8000",
);

export const env = createEnv({
  server: {
    API_UPSTREAM_URL: ApiUpstreamUrl,
  },
  runtimeEnv: {
    API_UPSTREAM_URL: process.env.API_UPSTREAM_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
