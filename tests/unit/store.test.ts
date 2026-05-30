import { describe, it, expect, beforeEach } from "vitest";
import { JsonStore } from "../../src/core/store.js";
import type { Link } from "../../src/core/types.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function tmpFile(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "linkhq-")), "links.json");
}

const sample: Link = {
  slug: "demo",
  url: "https://example.com/",
  clicks: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("JsonStore", () => {
  let store: JsonStore;
  beforeEach(() => {
    store = new JsonStore(tmpFile());
  });

  it("returns an empty array when the file does not exist", () => {
    expect(store.all()).toEqual([]);
    expect(store.get("nope")).toBeUndefined();
  });

  it("round-trips a link through put and get", () => {
    store.put(sample);
    expect(store.get("demo")).toEqual(sample);
    expect(store.all()).toHaveLength(1);
  });

  it("put overwrites an existing slug rather than duplicating", () => {
    store.put(sample);
    store.put({ ...sample, clicks: 5 });
    expect(store.all()).toHaveLength(1);
    expect(store.get("demo")?.clicks).toBe(5);
  });

  it("delete removes a link and reports whether it existed", () => {
    store.put(sample);
    expect(store.delete("demo")).toBe(true);
    expect(store.delete("demo")).toBe(false);
    expect(store.all()).toEqual([]);
  });

  it("reset replaces all contents with the provided seed", () => {
    store.put(sample);
    store.reset([{ ...sample, slug: "seeded" }]);
    expect(store.all().map((l) => l.slug)).toEqual(["seeded"]);
  });
});
