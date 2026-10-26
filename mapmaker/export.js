// SAVING AND LOADING. A map is two files in its folder (the dev server
// writes them, see vite.config.mjs):
//
//   <name>.json   the map as the editor keeps it (store.js), to open again
//   <name>.glb    the placed objects, baked: one node per placement, named
//                 by its id, carrying the placement as extras, so a game
//                 stands each on its own ground (../runtime/mapLoader.js)
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const q = (params) => new URLSearchParams(params).toString();

export async function listMaps(folder) {
  const r = await fetch(`/__maps/list?${q({ to: folder })}`);
  return r.json();
}

export async function loadMap(folder, name) {
  const r = await fetch(`/__maps/load?${q({ to: folder, name })}`);
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

export async function saveJson(map) {
  const body = JSON.stringify({ ...map, savedAt: new Date().toISOString() }, null, 2);
  const r = await fetch(`/__maps/save?${q({ to: map.folder, name: map.name, kind: "json" })}`, { method: "POST", body });
  const out = await r.json();
  if (!r.ok) throw new Error(out.error);
  return out;
}

// The editor's own marks (a patch's plate and outline, `userData.editorOnly`)
// are hidden while the file is written, so only the things go in it.
export async function saveGlb(map, group) {
  if (!group) throw new Error("nothing on the stage yet");
  const hidden = [];
  group.traverse((o) => {
    if (o.userData.editorOnly && o.visible) {
      o.visible = false;
      hidden.push(o);
    }
  });
  try {
    const glb = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true });
    const r = await fetch(`/__maps/save?${q({ to: map.folder, name: map.name, kind: "glb" })}`, { method: "POST", body: glb });
    const out = await r.json();
    if (!r.ok) throw new Error(out.error);
    return out;
  } finally {
    for (const o of hidden) o.visible = true;
  }
}
