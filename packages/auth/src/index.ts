import { client } from "@crossval/db";
import { env } from "@crossval/env/server";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { redisSecondaryStorage } from "./redis-secondary-storage.js";

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
    secondaryStorage: redisSecondaryStorage,
    session: { storeSessionInDatabase: true },
    verification: { storeInDatabase: true },
    rateLimit: {
      window: 60,
      max: 100,
      storage: "secondary-storage",
    },
    advanced: {
      ipAddress: {
        trustedProxies: [env.TRUSTED_PROXY_IP],
        ipv6Subnet: 64,
      },
    },
    trustedOrigins: [env.CORS_ORIGIN],
  });
}

export const auth = createAuth();
