import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

const ApiOriginToken = type("string").narrow((value) => value.length >= 32);

const ApiUpstreamUrl = type("string | undefined")
  .pipe((value) => value ?? "http://localhost:8000/crossval")
  .to("string.url");

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
