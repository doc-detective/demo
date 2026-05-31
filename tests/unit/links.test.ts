import { describe, it, expect, beforeEach } from "vitest";
import {
  createLink,
  listLinks,
  getLink,
  deleteLink,
  resolveLink,
} from "../../src/core/links.js";
import { JsonStore } from "../../src/core/store.js";
import { isValidSlug } from "../../src/core/slug.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function freshStore(): JsonStore {
  return new JsonStore(
    path.join(fs.mkdtempSync(path.join(os.tmpdir(), "linkhq-")), "links.json")
  );
}

describe("createLink", () => {
  let store: JsonStore;
  beforeEach(() => {
    store = freshStore();
  });

  it("creates a link with an explicit slug and zero clicks", async () => {
    const link = await createLink(store, {
      url: "https://example.com/path",
      slug: "demo",
    });
    expect(link.slug).toBe("demo");
    expect(link.url).toBe("https://example.com/path");
    expect(link.clicks).toBe(0);
    expect(link.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("generates a valid random slug when none is given", async () => {
    const link = await createLink(store, { url: "https://example.com" });
    expect(isValidSlug(link.slug)).toBe(true);
  });

  it("rejects an invalid (non-http) URL", async () => {
    await expect(
      createLink(store, { url: "not-a-url" })
    ).rejects.toThrow(/url/i);
    await expect(
      createLink(store, { url: "ftp://example.com" })
    ).rejects.toThrow(/http/i);
  });

  it("rejects a duplicate slug", async () => {
    await createLink(store, { url: "https://example.com", slug: "dup" });
    await expect(
      createLink(store, { url: "https://example.org", slug: "dup" })
    ).rejects.toThrow(/exist/i);
  });

  it("rejects an invalid slug", async () => {
    await expect(
      createLink(store, { url: "https://example.com", slug: "Bad Slug" })
    ).rejects.toThrow(/slug/i);
  });

  it("fills a description when ai is requested (fallback is fine)", async () => {
    const link = await createLink(store, { url: "https://example.com", ai: true });
    expect(link.description).toBeTruthy();
    expect(isValidSlug(link.slug)).toBe(true);
  });
});

describe("list / get / delete / resolve", () => {
  let store: JsonStore;
  beforeEach(() => {
    store = freshStore();
  });

  it("lists created links", async () => {
    await createLink(store, { url: "https://a.com", slug: "a" });
    await createLink(store, { url: "https://b.com", slug: "b" });
    expect(listLinks(store).map((l) => l.slug).sort()).toEqual(["a", "b"]);
  });

  it("gets a link without incrementing clicks", async () => {
    await createLink(store, { url: "https://a.com", slug: "a" });
    getLink(store, "a");
    expect(getLink(store, "a")?.clicks).toBe(0);
    expect(getLink(store, "missing")).toBeUndefined();
  });

  it("deletes a link", async () => {
    await createLink(store, { url: "https://a.com", slug: "a" });
    expect(deleteLink(store, "a")).toBe(true);
    expect(getLink(store, "a")).toBeUndefined();
  });

  it("resolveLink increments clicks and returns the link", async () => {
    await createLink(store, { url: "https://a.com", slug: "a" });
    expect(resolveLink(store, "a")?.url).toBe("https://a.com/");
    resolveLink(store, "a");
    expect(getLink(store, "a")?.clicks).toBe(2);
    expect(resolveLink(store, "missing")).toBeUndefined();
  });
});
