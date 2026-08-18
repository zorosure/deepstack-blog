import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server renders the Deepstack home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>深栈｜工程、AI 与系统思考<\/title>/);
  assert.match(html, /把复杂技术/);
  assert.match(html, /keep-cognitive-friction/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("GitHub Pages output contains home, articles, and social card", async () => {
  const home = await readFile(new URL("../pages-dist/index.html", import.meta.url), "utf8");
  const article = await readFile(new URL("../pages-dist/posts/keep-cognitive-friction/index.html", import.meta.url), "utf8");
  assert.match(home, /DEEPSTACK NOTES/);
  assert.match(home, /posts\/keep-cognitive-friction\//);
  assert.match(article, /保留四个停顿点/);
  assert.match(article, /NEXT NOTE/);
  await access(new URL("../pages-dist/og.png", import.meta.url));
  await access(new URL("../pages-dist/.nojekyll", import.meta.url));
});
