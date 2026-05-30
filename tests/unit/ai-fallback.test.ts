import { describe, it, expect } from "vitest";
import { enrich, fallbackEnrich } from "../../src/core/ai.js";
import { isValidSlug } from "../../src/core/slug.js";

describe("AI enrichment fallback", () => {
  it("fallbackEnrich returns a valid slug and a non-empty description", () => {
    const e = fallbackEnrich("https://example.com/some/page");
    expect(isValidSlug(e.slug)).toBe(true);
    expect(e.description.length).toBeGreaterThan(0);
    expect(e.source).toBe("fallback");
  });

  it("enrich() falls back gracefully when no model is configured", async () => {
    // No LINKHQ_MODEL env and no models/*.gguf in CI -> fallback path.
    const e = await enrich("https://example.com");
    expect(isValidSlug(e.slug)).toBe(true);
    expect(e.description.length).toBeGreaterThan(0);
    expect(e.description.length).toBeLessThanOrEqual(120);
  });
});
