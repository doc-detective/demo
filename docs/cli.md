# CLI reference

The `linkhq` CLI manages links from your terminal. It imports the same core as the API and reads/writes the same `data/links.json`, so links you create on the CLI show up in the UI and API too.

Run it during development with `tsx`:

```bash
npx tsx src/cli.ts <command> [options]
```

Or via the npm script: `npm run cli -- <command>`.

## create

Create a shortened link.

```bash
npx tsx src/cli.ts create <url> [--slug <slug>] [--ai]
```

| Option | Description |
| --- | --- |
| `<url>` | Destination URL (required). |
| `--slug <slug>` | Custom slug; random if omitted. |
| `--ai` | Suggest a slug and description with the local model (see [AI enrichment](ai.md)). |

```bash
npx tsx src/cli.ts create https://example.com --slug hello
```

Output:

```
Created /hello -> https://example.com/
```

## list

List all links with their click counts.

```bash
npx tsx src/cli.ts list
```

Output (one line per link):

```
/hello	0 clicks	https://example.com/
```

## delete

Delete a link by slug.

```bash
npx tsx src/cli.ts delete hello
```

Output:

```
Deleted /hello
```

## reset

Restore the store to the checked-in seed (`data/seed.json`).

```bash
npx tsx src/cli.ts reset
```

The create → list → delete flow above is validated by `tests/doc-detective/cli.spec.json`.
