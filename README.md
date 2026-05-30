# LinkHQ-TS

A deliberately tiny **URL shortener** built as a demo for [Doc Detective](https://doc-detective.com/) and the **Docs as Tests** methodology.

It exposes the same core functionality through three interfaces:

- **Web UI** — `http://localhost:3000`
- **REST API** — `/api/links`
- **CLI** — `linkhq`

All three import one shared core (`src/core/`), so the behavior you document for one interface holds for the others. An optional **local-model** feature suggests memorable slugs and descriptions, with a deterministic fallback when the model is unavailable. It uses [Qwen3.5 0.8B](https://huggingface.co/unsloth/Qwen3.5-0.8B-GGUF) (4-bit), downloaded and managed by [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) — pre-fetch it with `npm run model:pull`.

> This is a proof of concept, not a production product. No auth, JSON-file storage, minimal features.

## Quick start

```bash
npm install
npm start        # serve UI + API at http://localhost:3000
```

In another terminal:

```bash
npm run cli -- list                                  # or: npx tsx src/cli.ts list
npx tsx src/cli.ts create https://example.com --slug hello
```

## Features

| Capability | UI | API | CLI |
| --- | --- | --- | --- |
| Create a short link | ✅ | `POST /api/links` | `linkhq create` |
| List links | ✅ | `GET /api/links` | `linkhq list` |
| Delete a link | ✅ | `DELETE /api/links/:slug` | `linkhq delete` |
| Redirect + click count | `GET /:slug` | `GET /:slug` | (via redirect) |
| AI slug + description | ✅ checkbox | `"ai": true` | `--ai` |

## Testing the docs

The [`docs/`](docs/) procedures are validated against the running app with Doc Detective.

```bash
npm test                       # unit tests (Vitest, red/green TDD)
npm start                      # in one terminal
npm run docs:test              # in another: run Doc Detective specs + inline doc tests
npx tsx tests/eval/ai-eval.ts  # probabilistic AI eval
```

See [docs/getting-started.md](docs/getting-started.md) to begin.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request across **Ubuntu, macOS, and Windows**:

- type-check (`tsc --noEmit`), unit tests (Vitest), and the Doc Detective specs (API, CLI, inline doc, AI eval) on all three OSes
- the browser-based UI spec on Ubuntu (with headless Chrome)

CI installs with `--omit=optional`, so the native `node-llama-cpp` model dependency is skipped and the AI feature exercises its deterministic fallback — the suite needs no model download.

## Platform support

The app, CLI, and tests are pure TypeScript and run anywhere Node 20+ runs. The optional AI model uses `node-llama-cpp`, which ships prebuilt binaries for Linux/macOS/Windows (x64 and arm64); if a prebuilt isn't available it's skipped and the deterministic fallback is used.
