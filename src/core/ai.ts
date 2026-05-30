import fs from "node:fs";
import path from "node:path";
import { randomSlug, isValidSlug } from "./slug.js";

export interface Enrichment {
  /** A memorable slug suggestion. */
  slug: string;
  /** A short human description (<= 120 chars). */
  description: string;
  /** Where the enrichment came from. */
  source: "model" | "fallback";
}

const MAX_DESCRIPTION = 120;

/** Hostname helper that never throws. */
function safeHost(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

/** Deterministic, dependency-free enrichment used when no model is available. */
export function fallbackEnrich(url: string): Enrichment {
  const host = safeHost(url);
  return {
    slug: randomSlug(),
    description: `Link to ${host}`.slice(0, MAX_DESCRIPTION),
    source: "fallback",
  };
}

/** Resolve a GGUF model path from env or the local models/ directory. */
function findModelPath(): string | undefined {
  if (process.env.LINKHQ_MODEL && fs.existsSync(process.env.LINKHQ_MODEL)) {
    return process.env.LINKHQ_MODEL;
  }
  const modelsDir = path.join(process.cwd(), "models");
  try {
    const gguf = fs.readdirSync(modelsDir).find((f) => f.endsWith(".gguf"));
    if (gguf) return path.join(modelsDir, gguf);
  } catch {
    /* no models dir */
  }
  return undefined;
}

/** Sanitize raw model output into a valid slug, falling back to random. */
function coerceSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return isValidSlug(cleaned) ? cleaned : randomSlug();
}

/**
 * Enrich a URL with a memorable slug + description.
 *
 * Tries a local GGUF model via node-llama-cpp (lazy-loaded, optional). On any
 * failure — no model file, missing native dependency, or model error — it
 * returns the deterministic fallback so the app always works offline.
 */
export async function enrich(url: string): Promise<Enrichment> {
  const modelPath = findModelPath();
  if (!modelPath) return fallbackEnrich(url);

  try {
    // Lazy, optional import: never a hard dependency.
    const llama = await import("node-llama-cpp");
    const { getLlama, LlamaChatSession } = llama as typeof import("node-llama-cpp");
    const engine = await getLlama();
    const model = await engine.loadModel({ modelPath });
    const context = await model.createContext();
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
    });

    const host = safeHost(url);
    const slugRaw = await session.prompt(
      `Suggest a short, memorable, lowercase, hyphenated slug (2-3 words) for a link to ${url}. Reply with only the slug.`
    );
    const descRaw = await session.prompt(
      `In one short sentence (max 15 words), describe a link to ${host}. Reply with only the sentence.`
    );

    await context.dispose();
    await model.dispose();

    return {
      slug: coerceSlug(slugRaw),
      description: descRaw.trim().replace(/\s+/g, " ").slice(0, MAX_DESCRIPTION),
      source: "model",
    };
  } catch {
    return fallbackEnrich(url);
  }
}
