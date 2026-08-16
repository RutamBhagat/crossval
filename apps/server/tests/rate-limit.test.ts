import { Hono } from "hono";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { describe, expect, it } from "vitest";

import {
  createRateLimit,
  getClientAddress,
} from "../src/middleware/rate-limit";

function createTestApp(points = 2) {
  const app = new Hono();
  app.use(
    "*",
    createRateLimit({
      limiter: new RateLimiterMemory({ points, duration: 60 }),
      key: () => "client-1",
    }),
  );
  app.get("/", (context) => context.json({ ok: true }));
  return app;
}

describe("rate limit client address", () => {
  it("uses the forwarded client address from the trusted proxy", () => {
    expect(
      getClientAddress(
        "10.0.0.21",
        "203.0.113.8, 198.51.100.4",
        "10.0.0.21",
      ),
    ).toBe("203.0.113.8");
  });

  it("recognizes an IPv4-mapped trusted proxy address", () => {
    expect(
      getClientAddress(
        "::ffff:10.0.0.21",
        "203.0.113.8",
        "10.0.0.21",
      ),
    ).toBe("203.0.113.8");
  });

  it("ignores a forwarded address from an untrusted peer", () => {
    expect(
      getClientAddress("::ffff:198.51.100.4", "203.0.113.8", "10.0.0.21"),
    ).toBe("198.51.100.4");
  });

  it("uses the trusted proxy address when its forwarded address is invalid", () => {
    expect(getClientAddress("10.0.0.21", "invalid", "10.0.0.21")).toBe(
      "10.0.0.21",
    );
  });
});

describe("rate limit middleware", () => {
  it("reports the limit and remaining points", async () => {
    const app = createTestApp();

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBe("2");
    expect(response.headers.get("RateLimit-Remaining")).toBe("1");
  });

  it("returns 429 after the client exhausts its points", async () => {
    const app = createTestApp();

    await app.request("/");
    await app.request("/");
    const response = await app.request("/");

    expect(response.status).toBe(429);
    expect(response.headers.get("RateLimit-Limit")).toBe("2");
    expect(response.headers.get("RateLimit-Remaining")).toBe("0");
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    await expect(response.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      retryAfter: expect.any(Number),
    });
  });

  it("skips excluded routes without consuming points", async () => {
    const app = new Hono();
    app.use(
      "*",
      createRateLimit({
        limiter: new RateLimiterMemory({ points: 1, duration: 60 }),
        key: () => "client-1",
        skip: (context) => context.req.path === "/health",
      }),
    );
    app.get("/health", (context) => context.text("ok"));
    app.get("/data", (context) => context.text("ok"));

    const health = await app.request("/health");
    const firstData = await app.request("/data");
    const secondData = await app.request("/data");

    expect(health.status).toBe(200);
    expect(health.headers.has("RateLimit-Limit")).toBe(false);
    expect(firstData.status).toBe(200);
    expect(secondData.status).toBe(429);
  });

  it("fails open when no client key is available", async () => {
    const app = new Hono();
    app.use(
      "*",
      createRateLimit({
        limiter: new RateLimiterMemory({ points: 1, duration: 60 }),
        key: () => undefined,
      }),
    );
    app.get("/", (context) => context.text("ok"));

    const first = await app.request("/");
    const second = await app.request("/");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.headers.has("RateLimit-Limit")).toBe(false);
  });
});
