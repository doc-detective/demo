# Web UI guide

The web UI lives at `http://localhost:3000` and is the friendliest way to manage links.

## Create a link

1. Open `http://localhost:3000`.
2. In the **Destination URL** field, enter the URL you want to shorten, for example `https://example.com`.
3. (Optional) In the **Custom slug** field, enter a slug such as `hello`. Leave it blank for a random slug.
4. (Optional) Select **Use AI to suggest a slug & description** to let the local model name the link. See [AI enrichment](ai.md).
5. Select **Create Link**.

A confirmation message reads `Created /<slug>`, and the link appears in the **Links** table.

## View and follow links

The **Links** table lists every short link with its destination, description, and **click count**. Select a short link (for example `/hello`) to open it in a new tab; you are redirected to the destination and the click count increases.

## Delete a link

In the **Links** table, select **Delete** in the row for the link you want to remove. The row disappears immediately.

## Field reference

| Field | Required | Notes |
| --- | --- | --- |
| Destination URL | Yes | Must start with `http://` or `https://`. |
| Custom slug | No | Lowercase letters, digits, and hyphens; up to 40 characters. |
| Use AI | No | Suggests a slug and description from a local model, or a model-free fallback (random slug + templated description). |

The end-to-end UI procedure above is validated by `tests/doc-detective/ui.spec.json`.
