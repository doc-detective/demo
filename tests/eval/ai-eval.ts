/**
 * Probabilistic eval for the AI enrichment capability.
 *
 * Unlike the deterministic Doc Detective specs, the AI output is
 * non-deterministic, so we assert *structural properties* over several runs
 * rather than exact text:
 *   - the suggested slug is a valid slug
 *   - the description is non-empty and <= 120 characters
 *
 * It runs against the local model when one is installed (LINKHQ_MODEL or
 * models/*.gguf) and otherwise against the deterministic fallback, so it
 * always produces a result. Exit code is non-zero only if a structural
 * property is violated.
 */
import { enrich } from "../../src/core/ai.js";
import { isValidSlug } from "../../src/core/slug.js";

const URLS = [
  "https://example.com/blog/getting-started",
  "https://anthropic.com/research",
  "https://doc-detective.com/docs/get-started",
];
const RUNS_PER_URL = 2;

interface Check {
  url: string;
  slug: string;
  source: string;
  slugOk: boolean;
  descOk: boolean;
}

async function main() {
  const checks: Check[] = [];
  for (const url of URLS) {
    for (let i = 0; i < RUNS_PER_URL; i++) {
      const e = await enrich(url);
      checks.push({
        url,
        slug: e.slug,
        source: e.source,
        slugOk: isValidSlug(e.slug),
        descOk: e.description.length > 0 && e.description.length <= 120,
      });
    }
  }

  const passed = checks.filter((c) => c.slugOk && c.descOk).length;
  const total = checks.length;
  const usingModel = checks.some((c) => c.source === "model");

  console.log(`AI eval: ${passed}/${total} structural checks passed`);
  console.log(
    usingModel
      ? "Source: local model (node-llama-cpp)"
      : "Source: deterministic fallback (no GGUF model installed) — structure still validated"
  );

  if (passed !== total) {
    for (const c of checks.filter((c) => !(c.slugOk && c.descOk))) {
      console.error(`  FAIL ${c.url} -> slug="${c.slug}" slugOk=${c.slugOk} descOk=${c.descOk}`);
    }
    process.exit(1);
  }
}

main();
