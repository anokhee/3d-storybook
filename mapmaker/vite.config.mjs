// The mapmaker's dev server: its own Vite entry in this repo, so it compiles
// the stories (JSX, React Three Fiber) with this repo's packages and serves
// the catalog's pictures from public/. Run with `npm run mapmaker`.
//
// It also keeps the maps: a map is saved as <name>.json (what the editor
// reads back) and <name>.glb (what a game loads, see ../runtime/mapLoader.js)
// into a folder the editor names — this repo's maps/ by default, or a game's
// own folder. Anything under the Desktop is allowed; nothing else is written.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const HERE = import.meta.dirname;
const REPO = path.resolve(HERE, "..");
const ALLOWED = path.join(os.homedir(), "Desktop");

// A folder a map may be saved to: `to` relative to the repo (or absolute),
// resolved, and only if it lies under ALLOWED.
const folderOf = (to) => {
  const abs = path.resolve(REPO, to || "maps");
  return abs.startsWith(ALLOWED + path.sep) || abs === ALLOWED ? abs : null;
};
const safeName = (name) => (typeof name === "string" && /^[\w-]{1,64}$/.test(name) ? name : null);

function mapsServer() {
  return {
    name: "mapmaker-maps",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, "http://x");
        if (!url.pathname.startsWith("/__maps/")) return next();
        // A game on another local port may post here too (the car page's
        // ?terrain hands over its ground), so cross-origin is let in.
        res.setHeader("access-control-allow-origin", "*");
        res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
        res.setHeader("access-control-allow-headers", "content-type");
        if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
        const json = (code, body) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); };
        const dir = folderOf(url.searchParams.get("to"));
        if (!dir) return json(400, { error: "that folder is not under the Desktop" });
        // GET /__maps/list?to=: the maps in that folder
        if (url.pathname === "/__maps/list") {
          if (!fs.existsSync(dir)) return json(200, { folder: dir, maps: [] });
          const maps = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
          return json(200, { folder: dir, maps });
        }
        const name = safeName(url.searchParams.get("name"));
        if (!name) return json(400, { error: "a map's name is letters, digits, - and _" });
        // GET /__maps/load?to=&name=[&kind=glb]: the map's json, or a glb in its folder (a terrain snapshot)
        if (url.pathname === "/__maps/load") {
          const glb = url.searchParams.get("kind") === "glb";
          const file = path.join(dir, `${name}.${glb ? "glb" : "json"}`);
          if (!fs.existsSync(file)) return json(404, { error: `no ${name}.${glb ? "glb" : "json"} in ${dir}` });
          res.setHeader("content-type", glb ? "model/gltf-binary" : "application/json");
          res.setHeader("cache-control", "no-store");
          return res.end(fs.readFileSync(file));
        }
        // POST /__maps/save?to=&name=&kind=json|glb: the body written as <name>.<kind>
        if (url.pathname === "/__maps/save" && req.method === "POST") {
          const kind = url.searchParams.get("kind");
          if (kind !== "json" && kind !== "glb") return json(400, { error: "kind is json or glb" });
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            try {
              fs.mkdirSync(dir, { recursive: true });
              const file = path.join(dir, `${name}.${kind}`);
              fs.writeFileSync(file, Buffer.concat(chunks));
              json(200, { ok: true, file, bytes: fs.statSync(file).size });
            } catch (e) { json(500, { error: String(e) }); }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: HERE,
  publicDir: path.join(REPO, "public"),
  plugins: [react(), mapsServer()],
  resolve: {
    alias: [
      // A story or two call Storybook's own hooks in their render (the duck's
      // useArgs); outside Storybook they get React's, and nothing to update.
      { find: /^storybook\/preview-api$/, replacement: path.join(HERE, "preview-api.js") },
    ],
  },
  server: { port: 6007, open: !process.env.MM_HEADLESS, strictPort: true, fs: { allow: [REPO] } },
});
