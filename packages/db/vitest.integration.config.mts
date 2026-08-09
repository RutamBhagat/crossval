import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    include: ["tests/**/*.integration.test.ts"],
    setupFiles: [fileURLToPath(new URL("./tests/setup.ts", import.meta.url))],
    testTimeout: 15_000,
  },
});
