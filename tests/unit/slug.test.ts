import { describe, it, expect, vi, afterEach } from "vitest";
import { randomSlug, isValidSlug } from "../../src/core/slug.js";

describe("randomSlug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("produces a valid slug of the requested length", () => {
    const s = randomSlug(6);
    expect(s).toHaveLength(6);
    expect(isValidSlug(s)).toBe(true);
  });

  it("maps the random source onto the slug alphabet deterministically", () => {
    // Alphabet is "a-z0-9" (36 chars): 0 -> "a", 0.5 -> "s", 0.999 -> "9".
    const sequence = [0, 0.5, 0.999];
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => sequence[i++ % sequence.length]);
    expect(randomSlug(3)).toBe("as9");
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
