import { describe, it, expect } from "vitest";
import { randomSlug, isValidSlug } from "../../src/core/slug.js";

describe("randomSlug", () => {
  it("produces a valid slug of the requested length", () => {
    const s = randomSlug(6);
    expect(s).toHaveLength(6);
    expect(isValidSlug(s)).toBe(true);
  });

  it("produces different slugs on repeated calls (overwhelmingly likely)", () => {
    const set = new Set(Array.from({ length: 50 }, () => randomSlug()));
    expect(set.size).toBeGreaterThan(45);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase alphanumerics and hyphens", () => {
    expect(isValidSlug("blue-otter-42")).toBe(true);
    expect(isValidSlug("abc")).toBe(true);
  });

  it("rejects empty, uppercase, spaces, and over-long slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("Has Space")).toBe(false);
    expect(isValidSlug("UPPER")).toBe(false);
    expect(isValidSlug("a".repeat(41))).toBe(false);
  });
});
