import { client } from "@crossval/db";
import { env } from "@crossval/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

export function createAuth() {
  return betterAuth({
    database: mongodbAdapter(client),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    session: { storeSessionInDatabase: true },
    verification: { storeInDatabase: true },
    rateLimit: { enabled: false },
    trustedOrigins: [env.CORS_ORIGIN],
  });
}

export const auth = createAuth();
