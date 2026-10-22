// THUMBNAILS: photographs every entry in the built Storybook into
// public/thumbs/<story id>.png, for the Catalog page.
//
//   npm run build-storybook   (first, so storybook-static/ is current)
//   npm run thumbs                              every entry
//   npm run thumbs -- albatross-statues-hand    just the entries named (story ids)
//   npm run thumbs -- --base http://localhost:6006 <ids>   photograph the RUNNING dev
//                             server instead of the build (what the toolbar's camera does)
//
// Every picture is taken under the flat (albatross) light at full day, so
// the catalog reads as one set. It serves storybook-static/ itself, opens each entry in a headless
// browser the size of a card, waits for the object to settle, and saves
// the picture. The pictures are committed, so the published site needs no
// browser. Rerun after adding or changing an object.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve("storybook-static");
const OUT = path.resolve("public/thumbs");
const SIZE = 480; // px, square
const SKIP = ["catalog--default", "about--docs"];

// --base <url>: a running Storybook to photograph (the dev server), in
// place of the build served below
const argv = process.argv.slice(2);
const baseAt = argv.indexOf("--base");
const BASE = baseAt >= 0 ? argv.splice(baseAt, 2)[1].replace(/\/$/, "") : null;

if (!BASE && !fs.existsSync(path.join(ROOT, "index.json"))) {
  console.error("thumbnails: no storybook-static/index.json — run `npm run build-storybook` first");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// A tiny static server for the build.
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
if (!BASE) await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = BASE ?? `http://127.0.0.1:${server.address().port}`;

const index = BASE ? await (await fetch(`${base}/index.json`)).json() : JSON.parse(fs.readFileSync(path.join(ROOT, "index.json"), "utf8"));
const only = argv;
console.log(`thumbnails: ${only.length ? only.length + " entries asked for" : "every entry"}`);
const ids = Object.values(index.entries)
  .filter((e) => e.type === "story" && !SKIP.includes(e.id) && (!only.length || only.some((o) => e.id.includes(o))))
  .map((e) => e.id)
  .sort();

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
let n = 0;
for (const id of ids) {
  // A dev server keeps a socket open for hot reloading, so "network idle" never
  // comes: it gets "load" and a longer settle instead
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=lighting:flat;daylight:1`, { waitUntil: BASE ? "load" : "networkidle" });
  await page.waitForTimeout(BASE ? 3000 : 1500);
  await page.screenshot({ path: path.join(OUT, `${id}.png`), type: "png" });
  n++;
  process.stdout.write(`\r${n}/${ids.length} ${id.padEnd(60)}`);
}
console.log(`\nthumbnails: ${n} written to public/thumbs/`);
await browser.close();
if (!BASE) server.close();
