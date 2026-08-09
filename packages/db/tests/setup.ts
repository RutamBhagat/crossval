process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.INTEGRATION_DATABASE_URL ??
  "mongodb://localhost:27017/crossval_integration?replicaSet=rs0";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ??
  "integration-test-secret-at-least-32-characters";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
