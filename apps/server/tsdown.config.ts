import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/server.ts",
    "./src/scripts/create-rate-limit-indexes.ts",
  ],
  format: "esm",
  outDir: "./dist",
  clean: true,
  deps: {
    alwaysBundle: [/@crossval\/.*/],
    neverBundle: ["@opentelemetry/api"],
    onlyBundle: false,
  },
});
