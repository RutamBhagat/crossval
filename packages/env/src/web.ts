import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    API_UPSTREAM_URL: z.url().default("http://localhost:8000/crossval"),
  },
  runtimeEnv: {
    API_UPSTREAM_URL: process.env.API_UPSTREAM_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
