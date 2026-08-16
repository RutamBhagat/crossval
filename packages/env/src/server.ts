import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

const CorsOrigin = type("string | undefined")
  .pipe((value) => value ?? "http://localhost:3000")
  .to("string.url");

const Host = type("string | undefined").pipe(
  (value) => value ?? "0.0.0.0",
);

const Port = type("string.integer.parse | undefined")
  .pipe((value) => value ?? 8000)
  .to("1 <= number <= 65535");

const NodeEnv = type(
  "'development' | 'production' | 'test' | undefined",
).pipe((value) => value ?? "development");

export const env = createEnv({
  server: {
    DATABASE_URL: type("string > 0"),
    BETTER_AUTH_SECRET: type("string >= 32"),
    BETTER_AUTH_URL: type("string.url"),
    GOOGLE_CLIENT_ID: type("string > 0"),
    GOOGLE_CLIENT_SECRET: type("string > 0"),
    CORS_ORIGIN: CorsOrigin,
    HOST: Host,
    PORT: Port,
    NODE_ENV: NodeEnv,
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
