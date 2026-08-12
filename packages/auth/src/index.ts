import { client } from "@crossval/db";
import { env } from "@crossval/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

export function createAuth() {
  return betterAuth({
    database: mongodbAdapter(client),
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.CORS_ORIGIN],
  });
}

export const auth = createAuth();
