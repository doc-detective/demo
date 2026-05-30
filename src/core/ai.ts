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

export interface EnrichOptions {
  /** Allow downloading the default model if it isn't present yet. */
  download?: boolean;
}

const MAX_DESCRIPTION = 120;

/**
 * Opinionated default model: Qwen3.5 0.8B, 4-bit (Q4_K_M) quantization,
 * from unsloth's GGUF release. Downloaded and managed by node-llama-cpp.
 * Override with LINKHQ_MODEL_URI, or point LINKHQ_MODEL at a local .gguf.
 */
export const DEFAULT_MODEL_URI =
  process.env.LINKHQ_MODEL_URI ?? "hf:unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M";

/** Directory where the model is cached (override with LINKHQ_MODELS_DIR). */
export function modelsDir(): string {
  return process.env.LINKHQ_MODELS_DIR ?? path.join(process.cwd(), "models");
}

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

function clampDescription(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_DESCRIPTION);
}

/**
 * Resolve the default model to a local file path, downloading it via
 * node-llama-cpp when `download` is true and it isn't cached yet. Returns
 * undefined (so callers can fall back) if the model is unavailable.
 */
async function resolveModelPath(download: boolean): Promise<string | undefined> {
  // Escape hatch used by unit tests to force the deterministic fallback.
  if (process.env.LINKHQ_DISABLE_MODEL) return undefined;

  const explicit = process.env.LINKHQ_MODEL;
  if (explicit) return fs.existsSync(explicit) ? explicit : undefined;

  try {
    // @ts-ignore optional native dependency, resolved lazily at runtime
    const { resolveModelFile } = await import("node-llama-cpp");
    const resolved = await resolveModelFile(DEFAULT_MODEL_URI, {
      directory: modelsDir(),
      download: download ? "auto" : false,
      cli: false,
    });
    return resolved && fs.existsSync(resolved) ? resolved : undefined;
  } catch {
    return undefined;
  }
}

// Minimal shape we use from a node-llama-cpp chat session. Declaring it locally
// keeps this module's types independent of the optional native dependency, so
// the project type-checks even when node-llama-cpp isn't installed (e.g. CI).
interface ChatSessionLike {
  prompt(
    text: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string>;
  resetChatHistory(): void;
}

// Cache a single loaded model + chat session per process. We deliberately
// never dispose the native context — disposing mid-process can crash the
// llama.cpp backend on some platforms, and reusing one session (reset between
// prompts) avoids reloading the ~0.5 GB model on every request.
let loadedSession: Promise<ChatSessionLike> | null = null;

async function getSession(modelPath: string): Promise<ChatSessionLike> {
  if (!loadedSession) {
    const sessionPromise = (async () => {
      // @ts-ignore optional native dependency, resolved lazily at runtime
      const nlc = await import("node-llama-cpp");
      const { getLlama, LlamaChatSession, QwenChatWrapper, resolveChatWrapper } = nlc;
      const llama = await getLlama();
      const model = await llama.loadModel({ modelPath });
      const context = await model.createContext({ contextSize: 4096 });

      // Qwen3.x is a reasoning model. For short, fast, single-shot enrichment
      // we discourage chain-of-thought so it answers directly. Falls back to
      // the auto-resolved wrapper for any non-Qwen override model.
      const auto = resolveChatWrapper(model);
      const chatWrapper =
        auto instanceof QwenChatWrapper
          ? new QwenChatWrapper({ variation: auto.variation, thoughts: "discourage" })
          : auto ?? undefined;

      return new LlamaChatSession({
        contextSequence: context.getSequence(),
        chatWrapper,
        systemPrompt:
          "You are a concise assistant. Reply with only what is asked, with no preamble or explanation.",
      });
    })();
    // Don't cache a rejected promise — a transient load failure should not
    // poison every future call. Clear the cache so a later call can retry.
    sessionPromise.catch(() => {
      if (loadedSession === sessionPromise) loadedSession = null;
    });
    loadedSession = sessionPromise;
  }
  return loadedSession;
}

/**
 * Download (or locate) the default model, showing CLI progress. Used by
 * `linkhq model pull`. Returns the local model path.
 */
export async function pullModel(): Promise<string> {
  const explicit = process.env.LINKHQ_MODEL;
  if (explicit && fs.existsSync(explicit)) return explicit;
  // @ts-ignore optional native dependency, resolved lazily at runtime
  const { resolveModelFile } = await import("node-llama-cpp");
  return resolveModelFile(DEFAULT_MODEL_URI, {
    directory: modelsDir(),
    download: "auto",
    cli: true,
  });
}

/**
 * Enrich a URL with a memorable slug + description.
 *
 * Uses the local Qwen3.5 0.8B model via node-llama-cpp. On any failure — no
 * model, missing native binary, or model error — it returns the deterministic
 * fallback so the app always works offline. Set `download: true` to fetch the
 * model on first use.
 */
export async function enrich(url: string, opts: EnrichOptions = {}): Promise<Enrichment> {
  const modelPath = await resolveModelPath(Boolean(opts.download));
  if (!modelPath) return fallbackEnrich(url);

  try {
    const session = await getSession(modelPath);
    const host = safeHost(url);

    session.resetChatHistory();
    const slugRaw = await session.prompt(
      `Suggest a short, memorable, lowercase, hyphenated slug (2-3 words) for a link to ${url}. Reply with only the slug, nothing else.`,
      { maxTokens: 48, temperature: 0.7 }
    );

    session.resetChatHistory();
    const descRaw = await session.prompt(
      `In one short sentence (max 15 words), describe a link to ${host}. Reply with only the sentence.`,
      { maxTokens: 96, temperature: 0.7 }
    );

    return {
      slug: coerceSlug(slugRaw),
      description: clampDescription(descRaw) || `Link to ${host}`,
      source: "model",
    };
  } catch {
    return fallbackEnrich(url);
  }
}
