import type { Link } from "./types.js";
import { JsonStore } from "./store.js";
import { randomSlug, isValidSlug } from "./slug.js";
import { enrich } from "./ai.js";

export interface CreateInput {
  url: string;
  slug?: string;
  title?: string;
  /** When true, use the local model (or fallback) to suggest slug + description. */
  ai?: boolean;
}

/** Validate and normalize a destination URL (http/https only). */
function normalizeUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`URL must use http or https: ${raw}`);
  }
  return u.toString();
}

/**
 * Create a shortened link. Slug precedence: explicit > AI suggestion > random.
 * This is the single shared entry point used by the API server and the CLI.
 */
export async function createLink(store: JsonStore, input: CreateInput): Promise<Link> {
  const url = normalizeUrl(input.url);

  let slug = input.slug;
  let description: string | undefined;

  if (input.ai) {
    const enriched = await enrich(url);
    slug = slug ?? enriched.slug;
    description = enriched.description;
  }

  slug = slug ?? randomSlug();
  if (!isValidSlug(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }
  if (store.get(slug)) {
    throw new Error(`Slug already exists: ${slug}`);
  }

  const link: Link = {
    slug,
    url,
    title: input.title,
    description,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
  store.put(link);
  return link;
}

export function listLinks(store: JsonStore): Link[] {
  return store.all();
}

/** Look up a link's metadata without counting it as a visit. */
export function getLink(store: JsonStore, slug: string): Link | undefined {
  return store.get(slug);
}

export function deleteLink(store: JsonStore, slug: string): boolean {
  return store.delete(slug);
}

/** Resolve a slug for redirection, incrementing its click counter. */
export function resolveLink(store: JsonStore, slug: string): Link | undefined {
  const link = store.get(slug);
  if (!link) return undefined;
  link.clicks += 1;
  store.put(link);
  return link;
}
