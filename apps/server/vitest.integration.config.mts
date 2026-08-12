import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    include: ["tests/**/*.integration.test.ts"],
    setupFiles: [
      fileURLToPath(new URL("./tests/setup.integration.ts", import.meta.url)),
    ],
    testTimeout: 15_000,
  },
});
