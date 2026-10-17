// Vite is the bundler Storybook runs on. This file's only real job is the
// ALIASES: short names that point at folders, so a story can write
//   import Bench from "@dollies/refactored/nouns/bench/Bench.jsx"
// instead of a long ../../projects/wooden-dollies/r3f/src/... path.
//
// Each project you pull into the library gets its own alias here. The
// project source lives under projects/<name>/ as a git submodule, so this
// repo never copies code out of the original project; it points at it.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Turns a path relative to THIS file into an absolute one.
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const DOLLIES = "./projects/wooden-dollies";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // ---- wooden-dollies -------------------------------------------------
      // The React Three Fiber app: every noun (bench, tree, ...) is under
      // @dollies/refactored/nouns/<name>/.
      { find: "@dollies", replacement: here(`${DOLLIES}/r3f/src`) },
      // Modules the dollies app shares with its vanilla sibling. The nouns
      // import these by these exact names, so they have to exist here too.
      { find: "@world", replacement: here(`${DOLLIES}/src/world`) },
      { find: "@grid", replacement: here(`${DOLLIES}/src/renderGrid`) },
      { find: "@scene", replacement: here(`${DOLLIES}/src/scene`) },

      // ---- three.js ------------------------------------------------------
      // Every file, ours and the projects', must get the SAME copy of three.
      // Two copies means objects built with one will not render in a scene
      // made by the other. Pointing the bare name at one file guarantees it.
      { find: /^three$/, replacement: here("./node_modules/three/build/three.module.js") },
      { find: /^three\/addons\//, replacement: here("./node_modules/three/examples/jsm/") },
    ],
  },
});
