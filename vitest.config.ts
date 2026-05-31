import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Unit tests must be fast and deterministic: never load the local model.
    env: { LINKHQ_DISABLE_MODEL: "1" },
  },
});
