#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { defaultStore } from "./core/store.js";
import {
  createLink,
  listLinks,
  deleteLink,
} from "./core/links.js";
import { pullModel, DEFAULT_MODEL_URI } from "./core/ai.js";
import type { Link } from "./core/types.js";

const store = defaultStore;
const program = new Command();

program
  .name("linkhq")
  .description("LinkHQ-TS — shorten URLs from the command line (shares the API's core).")
  .version("0.1.0");

program
  .command("create")
  .description("Create a shortened link")
  .argument("<url>", "destination URL")
  .option("-s, --slug <slug>", "custom slug")
  .option("--ai", "use the local model (or fallback) to suggest a slug & description")
  .action(async (url: string, opts: { slug?: string; ai?: boolean }) => {
    try {
      if (opts.ai) {
        console.log("Using AI enrichment (first run downloads the model; this can take a while)...");
      }
      const link = await createLink(store, {
        url,
        slug: opts.slug,
        ai: Boolean(opts.ai),
        aiDownload: Boolean(opts.ai),
      });
      console.log(`Created /${link.slug} -> ${link.url}`);
      if (link.description) console.log(`Description: ${link.description}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    } finally {
      // Loading the native model leaves resources that can crash on teardown;
      // exit explicitly once output is flushed.
      if (opts.ai) process.exit(process.exitCode ?? 0);
    }
  });

program
  .command("list")
  .description("List all links")
  .action(() => {
    const links = listLinks(store);
    if (links.length === 0) {
      console.log("No links yet.");
      return;
    }
    for (const link of links) {
      console.log(`/${link.slug}\t${link.clicks} clicks\t${link.url}`);
    }
  });

program
  .command("delete")
  .description("Delete a link by slug")
  .argument("<slug>", "slug to delete")
  .action((slug: string) => {
    if (deleteLink(store, slug)) {
      console.log(`Deleted /${slug}`);
    } else {
      console.error(`Error: no link with slug "${slug}"`);
      process.exitCode = 1;
    }
  });

program
  .command("reset")
  .description("Reset the store to the checked-in seed")
  .action(() => {
    const seedPath = path.join(process.cwd(), "data", "seed.json");
    let seed: Link[] = [];
    try {
      seed = JSON.parse(fs.readFileSync(seedPath, "utf8")) as Link[];
    } catch {
      seed = [];
    }
    store.reset(seed);
    console.log(`Reset store to ${seed.length} seeded link(s).`);
  });

const model = program.command("model").description("Manage the local AI model");

model
  .command("pull")
  .description("Download the default AI model via node-llama-cpp")
  .action(async () => {
    console.log(`Pulling model: ${DEFAULT_MODEL_URI}`);
    try {
      const modelPath = await pullModel();
      console.log(`Model ready at ${modelPath}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program.parseAsync();
