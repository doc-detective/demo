import fs from "node:fs";
import path from "node:path";
import type { Link } from "./types.js";

/**
 * A tiny JSON-file-backed store for links. Reads/writes synchronously so the
 * API server and CLI can safely share the same file for a proof-of-concept.
 */
export class JsonStore {
  constructor(private readonly filePath: string) {}

  private read(): Link[] {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Link[];
    } catch {
      return [];
    }
  }

  private write(links: Link[]): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(links, null, 2));
  }

  all(): Link[] {
    return this.read();
  }

  get(slug: string): Link | undefined {
    return this.read().find((l) => l.slug === slug);
  }

  /** Insert or overwrite a link by slug. */
  put(link: Link): void {
    const links = this.read().filter((l) => l.slug !== link.slug);
    links.push(link);
    this.write(links);
  }

  /** Remove a link; returns whether it existed. */
  delete(slug: string): boolean {
    const links = this.read();
    const next = links.filter((l) => l.slug !== slug);
    if (next.length === links.length) return false;
    this.write(next);
    return true;
  }

  /** Replace all contents with the given seed (default: empty). */
  reset(seed: Link[] = []): void {
    this.write(seed);
  }
}

/** Default data file location, overridable via LINKHQ_DATA. */
export function defaultDataPath(): string {
  return process.env.LINKHQ_DATA ?? path.join(process.cwd(), "data", "links.json");
}

/** Shared default store used by the server and CLI. */
export const defaultStore = new JsonStore(defaultDataPath());
