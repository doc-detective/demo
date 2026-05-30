import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultStore } from "./core/store.js";
import {
  createLink,
  listLinks,
  getLink,
  deleteLink,
  resolveLink,
} from "./core/links.js";
import type { Link } from "./core/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = defaultStore;
const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json());

// Serve the static web UI from src/web.
app.use(express.static(path.join(__dirname, "web")));

// --- REST API -------------------------------------------------------------

app.get("/api/links", (_req, res) => {
  res.json(listLinks(store));
});

app.post("/api/links", async (req, res) => {
  try {
    const { url, slug, title, ai } = req.body ?? {};
    const link = await createLink(store, {
      url,
      slug,
      title,
      ai: Boolean(ai),
      // The server never auto-downloads the ~0.5 GB model in response to a
      // request — it uses the model only if pre-pulled (`linkhq model pull`),
      // otherwise the fallback. Downloads are a deliberate CLI-side action.
      aiDownload: false,
    });
    res.status(201).json(link);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/links/:slug", (req, res) => {
  const link = getLink(store, req.params.slug);
  if (!link) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(link);
});

app.delete("/api/links/:slug", (req, res) => {
  const existed = deleteLink(store, req.params.slug);
  res.status(existed ? 204 : 404).end();
});

// Reset the store to the checked-in seed (for repeatable doc tests).
// This is a deliberate test/demo affordance and is disabled in production.
app.post("/api/reset", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Reset is disabled in production" });
    return;
  }
  const seedPath = path.join(process.cwd(), "data", "seed.json");
  let seed: Link[] = [];
  try {
    seed = JSON.parse(fs.readFileSync(seedPath, "utf8")) as Link[];
  } catch {
    seed = [];
  }
  store.reset(seed);
  res.json({ ok: true, count: seed.length });
});

// --- Redirect (must come after API + static) ------------------------------

app.get("/:slug", (req, res) => {
  const link = resolveLink(store, req.params.slug);
  if (!link) {
    res.status(404).send("Short link not found");
    return;
  }
  res.redirect(302, link.url);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LinkHQ-TS listening on http://localhost:${PORT}`);
});
