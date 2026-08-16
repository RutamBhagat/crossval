import { afterAll } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL:
    process.env.INTEGRATION_DATABASE_URL ??
    "mongodb://localhost:27017/crossval_integration?replicaSet=rs0",
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    "integration-test-secret-at-least-32-characters",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "test-google-client-id",
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET ?? "test-google-client-secret",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
});

const [{ connection }, { redisClient }] = await Promise.all([
  import("@crossval/db"),
  import("../src/redis"),
]);

afterAll(async () => {
  await connection.close();
  redisClient.disconnect();
});
