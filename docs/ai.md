# AI enrichment

LinkHQ-TS has one **non-deterministic** capability: it can use a small **local language model** to suggest a memorable slug and a short description for a link. This demonstrates how Docs as Tests handles probabilistic behavior, which can't be checked with exact-match assertions.

## The model

LinkHQ ships with one opinionated default model:

- **[Qwen3.5 0.8B](https://huggingface.co/unsloth/Qwen3.5-0.8B-GGUF)** (unsloth GGUF release)
- **4-bit quantization** (`Q4_K_M`) — small and fast on CPU
- Referenced as `hf:unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M`

The model is downloaded and managed by [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) and cached in the project's `models/` directory.

Qwen3.5 is a reasoning model, but LinkHQ runs it in **non-thinking mode** (`thoughts: "discourage"`) for these short, single-shot prompts — so enrichment answers directly and quickly instead of spending tokens on chain-of-thought.

## How it behaves

When you ask for AI enrichment (the **Use AI** checkbox, `"ai": true` in the API, or `--ai` on the CLI):

- **The first time**, LinkHQ downloads the default model (a few hundred MB), then prompts it for a slug and description.
- **Afterwards**, the cached model is reused.
- **If the model can't be loaded** (offline before the first download, or no native support), LinkHQ falls back to a random slug and a templated description (`Link to <host>`) — no model required.

Either way you get a valid slug and a non-empty description, so the app always works offline. AI is strictly an opt-in upgrade.

```bash
npx tsx src/cli.ts create https://example.com/blog/getting-started --ai
```

Example output (model output varies run to run):

```
Created /calm-river-pine -> https://example.com/blog/getting-started
Description: A getting-started blog post on example.com
```

## Pre-downloading the model

The first `--ai` run downloads the model automatically. To fetch it ahead of time (with a progress bar), run:

```bash
npm run model:pull
```

or directly:

```bash
npx tsx src/cli.ts model pull
```

The model is saved under `models/` and reused on every subsequent run.

## Overriding the default

You can point LinkHQ at a different model with environment variables:

| Variable | Purpose |
| --- | --- |
| `LINKHQ_MODEL` | Absolute path to a local `.gguf` file (skips the download entirely). |
| `LINKHQ_MODEL_URI` | A different node-llama-cpp model URI, e.g. `hf:<user>/<repo>:<quant>`. |
| `LINKHQ_MODELS_DIR` | Directory to cache downloaded models (default: `./models`). |

```bash
export LINKHQ_MODEL=/absolute/path/to/model.gguf
npx tsx src/cli.ts create https://example.com --ai
```

## Testing non-deterministic output

Because the model's wording changes between runs, the documentation test for this feature asserts **structural properties** rather than exact text:

- the suggested slug is a valid slug (`^[a-z0-9-]{1,40}$`)
- the description is non-empty and at most 120 characters

Run the probabilistic eval:

```bash
npx tsx tests/eval/ai-eval.ts
```

It runs several enrichments and reports how many passed the structural checks. The eval is also wrapped as a Doc Detective spec at `tests/doc-detective/ai-eval.spec.json`. With no model installed it validates the model-free fallback; with a model installed it validates real model output.
