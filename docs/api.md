# API reference

The REST API is served from the same process as the web UI at `http://localhost:3000`. All request and response bodies are JSON.

A `Link` object looks like this:

```json
{
  "slug": "hello",
  "url": "https://example.com/",
  "description": "Link to example.com",
  "clicks": 0,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

## Create a link

`POST /api/links`

| Body field | Required | Description |
| --- | --- | --- |
| `url` | Yes | Destination URL (`http`/`https`). |
| `slug` | No | Custom slug; random if omitted. |
| `ai` | No | When `true`, suggest a slug/description with the local model. |

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "slug": "hello"}'
```

Returns `201 Created` with the new `Link`. Invalid URLs or duplicate slugs return `400` with `{ "error": "..." }`.

## List links

`GET /api/links` returns `200` with an array of `Link` objects.

```bash
curl http://localhost:3000/api/links
```

## Get a link

`GET /api/links/:slug` returns `200` with the `Link`, or `404` if it does not exist. This does **not** count as a visit.

```bash
curl http://localhost:3000/api/links/hello
```

## Delete a link

`DELETE /api/links/:slug` returns `204 No Content` on success, or `404` if the slug does not exist.

```bash
curl -X DELETE http://localhost:3000/api/links/hello
```

## Follow a link

`GET /:slug` responds with a `302` redirect to the destination and increments the link's click count.

```bash
curl -i http://localhost:3000/hello
```

## Reset (test helper)

`POST /api/reset` restores the store to the checked-in seed (`data/seed.json`). This keeps documentation tests repeatable.

The full create → read → delete flow above is validated by `tests/doc-detective/api.spec.json`.
