import { Hono } from "hono";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { userRateLimitMock } from "./setup";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@crossval/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

import { createAuthenticatedRouter } from "../src/middleware/authenticated-router";
import { createRateLimit } from "../src/middleware/rate-limit";

function createTestRouter() {
  const router = createAuthenticatedRouter(
    createRateLimit({
      limiter: new RateLimiterMemory({ points: 1, duration: 60 }),
      policy: "user",
      key: (context) => context.get("userId"),
    }),
  );
  router.get("/", (context) => context.json({ ok: true }));
  return router;
}

describe("authenticated user rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockImplementation(async ({ headers }: { headers: Headers }) => {
      const userId = headers.get("Authorization");
      return userId ? { user: { id: userId } } : null;
    });
  });

  it("uses an independent bucket for each authenticated user", async () => {
    const router = createTestRouter();

    const first = await router.request("/", {
      headers: { Authorization: "user-1" },
    });
    const rejected = await router.request("/", {
      headers: { Authorization: "user-1" },
    });
    const otherUser = await router.request("/", {
      headers: { Authorization: "user-2" },
    });

    expect(first.status).toBe(200);
    expect(rejected.status).toBe(429);
    expect(otherUser.status).toBe(200);
  });

  it("enforces the user and IP policies as independent constraints", async () => {
    const app = new Hono();
    app.use(
      "*",
      createRateLimit({
        limiter: new RateLimiterMemory({ points: 3, duration: 60 }),
        policy: "ip",
        key: () => "shared-ip",
      }),
    );
    app.route("/", createTestRouter());

    expect(
      (
        await app.request("/", {
          headers: { Authorization: "user-1" },
        })
      ).status,
    ).toBe(200);

    const userRejected = await app.request("/", {
      headers: { Authorization: "user-1" },
    });
    expect(userRejected.status).toBe(429);
    expect(userRejected.headers.get("RateLimit-Limit")).toBe("1");
    await expect(userRejected.json()).resolves.toMatchObject({ policy: "user" });

    expect(
      (
        await app.request("/", {
          headers: { Authorization: "user-2" },
        })
      ).status,
    ).toBe(200);

    const ipRejected = await app.request("/", {
      headers: { Authorization: "user-3" },
    });
    expect(ipRejected.status).toBe(429);
    expect(ipRejected.headers.get("RateLimit-Limit")).toBe("3");
    await expect(ipRejected.json()).resolves.toMatchObject({ policy: "ip" });
  });

  it("invokes the default user limiter after authentication", async () => {
    const router = createAuthenticatedRouter();
    router.get("/", (context) => context.json({ ok: true }));

    const unauthenticated = await router.request("/");

    expect(unauthenticated.status).toBe(401);
    expect(userRateLimitMock).not.toHaveBeenCalled();

    const authenticated = await router.request("/", {
      headers: { Authorization: "user-1" },
    });

    expect(authenticated.status).toBe(200);
    expect(userRateLimitMock).toHaveBeenCalledOnce();
  });

  it("authenticates before it consumes the user bucket", async () => {
    const router = createTestRouter();

    const unauthenticated = await router.request("/");
    const authenticated = await router.request("/", {
      headers: { Authorization: "user-1" },
    });

    expect(unauthenticated.status).toBe(401);
    expect(authenticated.status).toBe(200);
  });
});
