import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userRateLimit: vi.fn(
    async (_context: unknown, next: () => Promise<void>) => next(),
  ),
}));

vi.mock("../src/middleware/user-rate-limit", () => ({
  userRateLimit: mocks.userRateLimit,
}));

export const userRateLimitMock = mocks.userRateLimit;
