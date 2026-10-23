// Vite is the bundler Storybook runs on. Every import in this repo is a
// plain relative path, so nothing here is required for the build. The one
// plugin is the Code panel's back end (see .storybook/code.jsx): while the
// dev server runs, it hands the panel the source files behind the entry
// on the stage, and writes an edited file back so Vite hot-reloads it.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const ROOT = path.resolve(".");
const EDITABLE = ["src", "stories"]; // the folders the panel may read and write under
const within = (file) => {
  const abs = path.resolve(ROOT, file);
  return EDITABLE.some((d) => abs.startsWith(path.join(ROOT, d) + path.sep)) && fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
};
// The source files behind a story: the story file, what it imports and what those import (two levels)
const filesOf = (story) => {
  const seen = new Set([story]);
  let level = [story];
  for (let depth = 0; depth < 2; depth++) {
    const next = [];
    for (const f of level) for (const i of importsOf(f)) if (!seen.has(i)) { seen.add(i); next.push(i); }
    level = next;
  }
  return [...seen];
};
// The relative imports of a file, resolved: "../src/nouns/bench/Bench.jsx" and the like
const importsOf = (abs) => {
  const dir = path.dirname(abs), out = [];
  for (const m of fs.readFileSync(abs, "utf8").matchAll(/^import[^"'\n]*from\s+["'](\.[^"']+)["']/gm)) {
    const p = path.resolve(dir, m[1]);
    if (within(path.relative(ROOT, p))) out.push(p);
  }
  return out;
};
function codePanelServer() {
  // The camera's job: which entries' pictures are being retaken, and how it went
  const retake = { running: false, ids: [], log: "", done: null };
  return {
    name: "object-library-code-panel",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, "http://x");
        const json = (code, body) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); };
        // GET /__library/files?story=./stories/Bench.stories.jsx: the story file, what it imports, and what those import (two levels), in src/ and stories/
        if (url.pathname === "/__library/files") {
          const story = within(url.searchParams.get("story") || "");
          if (!story) return json(404, { error: "no such story file" });
          return json(200, { files: filesOf(story).map((abs) => ({ path: path.relative(ROOT, abs), content: fs.readFileSync(abs, "utf8") })) });
        }
        // POST /__library/retake: photograph every entry whose source (the story file and what it
        // imports, two levels) is newer than its picture, or that has none, off this very server
        // (scripts/thumbnails.mjs --base). GET /__library/retake: how that is going.
        if (url.pathname === "/__library/retake") {
          if (req.method !== "POST") return json(200, retake);
          if (retake.running) return json(409, { error: "already retaking", ...retake });
          // Under Storybook, Vite runs as middleware with no port of its own: the
          // server to photograph is whoever this request came in on
          const base = `http://${req.headers.host}`;
          fetch(`${base}/index.json`).then((r) => r.json()).then((index) => {
            const ids = [];
            for (const e of Object.values(index.entries)) {
              if (e.type !== "story" || !e.importPath || e.id === "catalog--default") continue;
              const story = within(e.importPath);
              if (!story) continue;
              const newest = Math.max(...filesOf(story).map((f) => fs.statSync(f).mtimeMs));
              const pic = path.join(ROOT, "public/thumbs", `${e.id}.png`);
              if (!fs.existsSync(pic) || fs.statSync(pic).mtimeMs < newest) ids.push(e.id);
            }
            Object.assign(retake, { running: ids.length > 0, ids, log: "", done: ids.length ? null : new Date().toISOString() });
            if (!ids.length) return;
            const child = spawn(process.execPath, ["scripts/thumbnails.mjs", "--base", base, ...ids], { cwd: ROOT });
            child.stdout.on("data", (d) => (retake.log += d));
            child.stderr.on("data", (d) => (retake.log += d));
            child.on("close", (code) => Object.assign(retake, { running: false, done: new Date().toISOString(), code }));
          }).catch((e) => Object.assign(retake, { running: false, log: String(e), done: new Date().toISOString() }));
          return json(202, { started: true });
        }
        // POST /__library/meta {id, patch}: an entry's description, tags and status
        // (.storybook/meta.js), merged into public/library-meta.json; empty fields are dropped
        if (url.pathname === "/__library/meta" && req.method === "POST") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const { id, patch } = JSON.parse(body);
              if (typeof id !== "string" || !id || typeof patch !== "object" || !patch) return json(400, { error: "needs an id and a patch" });
              const file = path.join(ROOT, "public/library-meta.json");
              const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8") || "{}") : {};
              const next = { ...all[id] };
              if (typeof patch.description === "string") next.description = patch.description.trim();
              if (Array.isArray(patch.tags)) next.tags = patch.tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim());
              if (typeof patch.status === "string") next.status = patch.status;
              for (const k of Object.keys(next)) if (!next[k] || (Array.isArray(next[k]) && !next[k].length)) delete next[k];
              if (Object.keys(next).length) all[id] = next; else delete all[id];
              fs.writeFileSync(file, JSON.stringify(Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");
              json(200, { ok: true, meta: all[id] ?? {} });
            } catch (e) { json(400, { error: String(e) }); }
          });
          return;
        }
        // POST /__library/save {file, content}: written back; Vite sees the change and hot-reloads
        if (url.pathname === "/__library/save" && req.method === "POST") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const { file, content } = JSON.parse(body);
              const abs = within(file);
              if (!abs || typeof content !== "string") return json(400, { error: "not a file the panel may write" });
              fs.writeFileSync(abs, content);
              json(200, { ok: true });
            } catch (e) { json(400, { error: String(e) }); }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), codePanelServer()],
});
