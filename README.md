# LinkHQ-TS

A deliberately tiny **URL shortener** built as a demo for [Doc Detective](https://doc-detective.com/) and the **Docs as Tests** methodology.

It exposes the same core functionality through three interfaces:

- **Web UI** — `http://localhost:3000`
- **REST API** — `/api/links`
- **CLI** — `linkhq`

All three import one shared core (`src/core/`), so the behavior you document for one interface holds for the others. An optional **local-model** feature (via [node-llama-cpp](https://github.com/withcatai/node-llama-cpp)) suggests memorable slugs and descriptions, with a deterministic fallback when no model is installed.

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
