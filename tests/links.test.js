// Every relative href/src in every page must resolve to a real file; every home-page card must be a real experiment.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const pages = readdirSync(root, { recursive: true })
  .filter((f) => f.endsWith(".html") && !f.includes("node_modules"))
  .map((f) => join(root, f));

test("relative links resolve", () => {
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    for (const [, url] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
      let target = resolve(dirname(page), url);
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
      assert.ok(existsSync(target), `${page.replace(root, "")} → ${url}`);
    }
    for (const [, url] of html.matchAll(/from "(\.[^"]+)"/g))
      assert.ok(existsSync(resolve(dirname(page), url)), `${page} imports ${url}`);
  }
});

test("each home card is an experiment with the five steps", () => {
  const home = readFileSync(join(root, "index.html"), "utf8");
  const slugs = [...home.matchAll(/data-slug="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(slugs.length >= 3);
  for (const slug of slugs) {
    const html = readFileSync(join(root, slug, "index.html"), "utf8");
    assert.equal((html.match(/<section data-step/g) ?? []).length, 5, slug);
    assert.ok(existsSync(join(root, slug, "app.js")), `${slug}/app.js`);
    assert.match(
      readFileSync(join(root, slug, "app.js"), "utf8"),
      new RegExp(`lesson\\("${slug}"`),
      `${slug} uses its own storage key`,
    );
  }
});
