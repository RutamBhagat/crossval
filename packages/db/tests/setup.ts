process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.INTEGRATION_DATABASE_URL ??
  "mongodb://localhost:27017/crossval_integration?replicaSet=rs0";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ??
  "integration-test-secret-at-least-32-characters";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ?? "test-google-client-secret";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
