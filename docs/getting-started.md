# Getting started

LinkHQ-TS is a small URL shortener you can drive from a web UI, a REST API, or a CLI. This guide gets you from zero to your first short link.

## Prerequisites

- Node.js 20 or later
- The repository cloned locally

## Install and run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server (UI + API):

   ```bash
   npm start
   ```

   The app is now available at `http://localhost:3000`.

## Create your first link

Pick whichever interface you prefer — they all do the same thing.

### Web UI

1. Open `http://localhost:3000` in your browser.
2. Enter `https://example.com` in the **Destination URL** field.
3. Enter `hello` in the **Custom slug** field.
4. Select **Create Link**.

The link `/hello` appears in the **Links** table.

### API

Create a link with a single request:

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "slug": "hello"}'
```

The response is `201 Created` with the new link as JSON.

The following inline test confirms the API is reachable and creates a link end-to-end. Doc Detective runs it directly from this document.

[comment]: # (test start {"testId": "getting-started-inline"})
[comment]: # (step {"httpRequest": {"method": "post", "url": "http://localhost:3000/api/links", "request": {"body": {"url": "https://example.com", "slug": "qs-demo"}}, "statusCodes": [201], "response": {"body": {"slug": "qs-demo"}}}})
[comment]: # (step {"httpRequest": {"method": "delete", "url": "http://localhost:3000/api/links/qs-demo", "statusCodes": [204], "response": {"body": ""}}})
[comment]: # (test end)

### CLI

Create the same link from your terminal:

```bash
npx tsx src/cli.ts create https://example.com --slug hello
```

You should see:

```
Created /hello -> https://example.com/
```

## Use your short link

Visit `http://localhost:3000/hello`. You are redirected to the destination, and the link's click count increments by one.

## Next steps

- [Web UI guide](ui.md)
- [API reference](api.md)
- [CLI reference](cli.md)
- [AI enrichment](ai.md)
