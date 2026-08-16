import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

const ApiUpstreamUrl = type("string | undefined")
  .pipe((value) => value ?? "http://localhost:8000/crossval")
  .to("string.url");

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
