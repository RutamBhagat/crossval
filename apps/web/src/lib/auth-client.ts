import { createAuthClient } from "better-auth/react";

export function createCrossvalAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    fetchOptions: { credentials: "include" },
  });
}

export const authClient = createCrossvalAuthClient(
  typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
);
