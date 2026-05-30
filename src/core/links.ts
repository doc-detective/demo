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
  /** When true (with ai), allow downloading the default model if not cached. */
  aiDownload?: boolean;
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
 * Choose a free slug for an auto-generated link: use the AI suggestion if it's
 * valid and available, otherwise retry random slugs until one is free.
 */
function pickAvailableSlug(store: JsonStore, preferred?: string): string {
  if (preferred && isValidSlug(preferred) && !store.get(preferred)) {
    return preferred;
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomSlug();
    if (!store.get(candidate)) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

/**
 * Create a shortened link. Slug precedence: explicit > AI suggestion > random.
 * This is the single shared entry point used by the API server and the CLI.
 */
export async function createLink(store: JsonStore, input: CreateInput): Promise<Link> {
  const url = normalizeUrl(input.url);

  // Treat an empty or whitespace-only slug as "not provided".
  const explicitSlug = input.slug?.trim() ? input.slug.trim() : undefined;
  let aiSlug: string | undefined;
  let description: string | undefined;

  if (input.ai) {
    const enriched = await enrich(url, { download: Boolean(input.aiDownload) });
    aiSlug = enriched.slug;
    description = enriched.description;
  }

  let slug: string;
  if (explicitSlug) {
    // An explicitly requested slug must be valid and free — never silently changed.
    if (!isValidSlug(explicitSlug)) {
      throw new Error(`Invalid slug: ${explicitSlug}`);
    }
    if (store.get(explicitSlug)) {
      throw new Error(`Slug already exists: ${explicitSlug}`);
    }
    slug = explicitSlug;
  } else {
    // Otherwise prefer a free AI suggestion, then retry random slugs on collision.
    slug = pickAvailableSlug(store, aiSlug);
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
