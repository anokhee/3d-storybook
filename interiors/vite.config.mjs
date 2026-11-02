// The interiors editor's dev server: its own Vite entry in this repo, as
// the mapmaker's is (../mapmaker/vite.config.mjs), so it compiles the
// library's nouns (JSX, React Three Fiber) with this repo's packages and
// serves the catalog's pictures from public/. Run with `npm run interiors`.
// It writes nothing: a layout is copied out of the panel as a config.
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const HERE = import.meta.dirname;
const REPO = path.resolve(HERE, "..");

export default defineConfig({
  root: HERE,
  publicDir: path.join(REPO, "public"),
  // its own pre-bundled dependencies: shared with the storybook's and the
  // mapmaker's servers, one re-bundling made the others serve stale files
  cacheDir: path.join(REPO, "node_modules", ".vite-interiors"),
  plugins: [react()],
  resolve: {
    alias: [{ find: /^storybook\/preview-api$/, replacement: path.join(REPO, "mapmaker", "preview-api.js") }],
  },
  server: { port: 6009, open: !process.env.MM_HEADLESS, strictPort: true, fs: { allow: [REPO] } },
});
