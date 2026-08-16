import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    setupFiles: [fileURLToPath(new URL("./tests/setup.ts", import.meta.url))],
    exclude: [
      ...configDefaults.exclude,
      "tests/**/*.integration.test.ts",
    ],
  },
});
