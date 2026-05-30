# AI enrichment

LinkHQ-TS has one **non-deterministic** capability: it can use a small **local language model** to suggest a memorable slug and a short description for a link. This demonstrates how Docs as Tests handles probabilistic behavior, which can't be checked with exact-match assertions.

## How it behaves

When you ask for AI enrichment (the **Use AI** checkbox, `"ai": true` in the API, or `--ai` on the CLI):

- **With a model installed**, LinkHQ prompts the model for a slug and description.
- **Without a model**, LinkHQ falls back to a deterministic random slug and a templated description (`Link to <host>`).

Either way you get a valid slug and a non-empty description, so the app always works offline. AI is strictly an opt-in upgrade.

```bash
npx tsx src/cli.ts create https://example.com/blog/getting-started --ai
```

Example output (model output varies run to run):

```
Created /calm-river-pine -> https://example.com/blog/getting-started
Description: A getting-started blog post on example.com
```

## Enabling the local model

The model runs through [node-llama-cpp](https://github.com/withcatai/node-llama-cpp), an optional dependency.

1. Download a small instruction-tuned model in GGUF format (for example a 1–3B model) into a `models/` directory in the project root.
2. Point LinkHQ at it, either by placing a single `.gguf` file in `models/` or by setting an environment variable:

   ```bash
   export LINKHQ_MODEL=/absolute/path/to/model.gguf
   ```

3. Run any create command with `--ai`. If the model loads, descriptions and slugs come from the model; otherwise LinkHQ logs nothing special and uses the fallback.

## Testing non-deterministic output

Because the model's wording changes between runs, the documentation test for this feature asserts **structural properties** rather than exact text:

- the suggested slug is a valid slug (`^[a-z0-9-]{1,40}$`)
- the description is non-empty and at most 120 characters

Run the probabilistic eval:

```bash
npx tsx tests/eval/ai-eval.ts
```

It runs several enrichments and reports how many passed the structural checks. The eval is also wrapped as a Doc Detective spec at `tests/doc-detective/ai-eval.spec.json`. With no model installed it validates the deterministic fallback; with a model installed it validates real model output.
