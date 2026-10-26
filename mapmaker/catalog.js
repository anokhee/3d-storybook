// THE CATALOG the mapmaker places from: every story in ../stories, read the
// way the Catalog page reads them, as entries. An entry is one named export
// of a story file (its Default, or a preset): its id (the picture's name in
// public/thumbs), its name and section, its knobs (`argTypes`: what can be
// turned, and how), their starting values (`args`), and `render`, which
// turns a set of args into the React element the story draws.
//
// What is left out: the planets (they ARE a world, not a thing on one), and
// anything else a story says to show in space; and the Catalog itself.
import { createElement, useMemo } from "react";
import { COVER, patchOf } from "../runtime/cover.js";
import { FENCE_KINDS } from "../runtime/fence.js";
import { TERRAIN, CLIFF_ARGS, RAMP_ARGS } from "../runtime/terrain.js";

// (the Catalog page itself is left out: it is Storybook's, not an object)
const modules = import.meta.glob(["../stories/*.stories.jsx", "!../stories/Catalog.stories.jsx"], { eager: true });

// Storybook's own id for a story (storybook/internal/csf toId), rebuilt here
// so the catalog needs none of Storybook: the title and the export's name
// (split into words where its case changes), each lowercased with runs of
// anything but letters and digits made one dash.
const sanitize = (s) =>
  s.toLowerCase().replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, "-").replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
const words = (name) =>
  name
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
export const toId = (title, exportName) => `${sanitize(title)}--${sanitize(words(exportName))}`;

function entriesOf() {
  const out = [];
  for (const [file, mod] of Object.entries(modules)) {
    if (file.endsWith("/Catalog.stories.jsx")) continue;
    const meta = mod.default;
    if (!meta?.title) continue;
    const path = meta.title.split("/");
    if (path[0] === "Planets" || path[0] === "Sky") continue;
    if (path[0] === "Terrain" && path[1] === "Water") continue; // the pond, ocean and spring are drawn as patches here (see COVER)
    const stage = typeof meta.parameters?.stage === "function" ? {} : meta.parameters?.stage ?? {};
    if (stage.backdrop === "space" || stage.off) continue;
    for (const [exportName, story] of Object.entries(mod)) {
      if (exportName === "default" || exportName.startsWith("__") || !story || typeof story !== "object" || Array.isArray(story)) continue;
      const render = story.render ?? meta.render;
      if (!render && !meta.component) continue;
      const storyName = story.name ?? words(exportName);
      const base = { ...(meta.args ?? {}), ...(story.args ?? {}) };
      out.push({
        id: toId(meta.title, exportName),
        file,
        name: path[path.length - 1] + (exportName === "Default" ? "" : ` · ${storyName}`),
        section: path.slice(0, -1).join(" / "),
        top: path[0],
        argTypes: { ...(meta.argTypes ?? {}), ...(story.argTypes ?? {}) },
        args: base,
        // The element for a set of args laid over the story's own. A story
        // with no render draws its component with the args as props.
        render: (args) => (render ? render({ ...base, ...args }) : createElement(meta.component, { ...base, ...args })),
      });
    }
  }
  return out.sort((a, b) => a.top.localeCompare(b.top) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
}

// GROUNDCOVER PATCHES are entries of this catalog's own, not stories: one
// per kind in ../runtime/cover.js, drawn by mapmaker/Patch.jsx. Their knobs
// are the patch's shape, in world units, and how thickly it is planted.
const range = (name, min, max, step) => ({ name, control: { type: "range", min, max, step } });
function coverEntries() {
  return Object.entries(COVER).map(([type, c]) => {
    const planted = c.density > 0;
    // a road is a stroke, not a rectangle: its knobs are its width and verge
    if (c.path)
      return {
        id: `cover-${type}`,
        file: null,
        name: c.label,
        section: "Groundcover",
        top: "Groundcover",
        cover: type,
        hidden: !!c.hidden,
        swatch: c.tint,
        argTypes: { width: range("width", 2, 16, 0.5), verge: range("verge", 0, 4, 0.25), fence: { name: "fence (both sides)", control: { type: "select", options: FENCE_KINDS } }, bridgeFence: { name: "bridge fence", control: { type: "select", options: FENCE_KINDS } } },
        args: { ...c.path },
        render: () => null,
      };
    return {
      id: `cover-${type}`,
      file: null,
      name: c.label,
      section: "Groundcover",
      top: "Groundcover",
      cover: type,
      hidden: !!c.hidden,
      swatch: c.tint,
      argTypes: {
        width: range("width", 1, 80, 0.5),
        length: range("length", 1, 40, 0.5),
        corner: range("corner", 0, 20, 0.5),
        blend: range("blend", 0, 8, 0.25),
        ...(planted ? { density: range("density", 0.1, 8, 0.1), size: range("size", 0.4, 2.5, 0.05) } : {}),
      },
      args: { ...patchOf(type), ...(planted ? { density: c.density } : {}) },
      render: () => null,
    };
  });
}

// TERRAIN is this catalog's own too: cliffs and ramps (../runtime/terrain.js),
// drawn by mapmaker/Terrain.jsx. A cliff's knobs are its shape and height;
// a ramp's its shape — its heights it reads off the cliffs at its ends.
function terrainEntries() {
  const shared = (id, kind, args, argTypes) => ({ id, file: null, name: TERRAIN[kind].label, section: "Terrain", top: "Terrain", terrain: kind, swatch: TERRAIN[kind].tint, argTypes, args, render: () => null });
  return [
    shared("terrain-cliff", "cliff", { ...CLIFF_ARGS }, {
      width: range("width", 2, 60, 0.5),
      length: range("length", 2, 60, 0.5),
      corner: range("corner", 0, 30, 0.5),
      blend: range("blend", 0, 8, 0.25),
      height: range("height", 0.5, 16, 0.1),
      layer: range("layer", 1, 3, 1),
      wobble: range("edge wobble", 0, 1.5, 0.05),
    }),
    shared("terrain-ramp", "ramp", { ...RAMP_ARGS, corner: 0 }, {
      width: range("width", 2, 20, 0.5),
      length: range("length", 2, 40, 0.5),
      road: { name: "road", control: { type: "boolean" } },
    }),
  ];
}

export const ENTRIES = [...entriesOf(), ...terrainEntries(), ...coverEntries()];
export const ENTRY = Object.fromEntries(ENTRIES.map((e) => [e.id, e]));
// A shape drawn on the ground (a patch or a piece of terrain), as against a thing stood on it.
export const isShape = (id) => !!(ENTRY[id]?.cover || ENTRY[id]?.terrain);

// The categories, in the sidebar's order; anything new goes after.
const ORDER = ["Primitives", "Furniture", "Lighting", "Machines", "Machine Parts", "Fixtures", "Buildings", "Nature", "Terrain", "Groundcover", "Ornaments", "Animals", "Characters", "Toys", "Vehicles", "Instruments", "Monuments", "Props", "Misc"];
export const TOPS = [...new Set(ENTRIES.map((e) => e.top))].sort((a, b) => {
  const i = ORDER.indexOf(a), j = ORDER.indexOf(b);
  return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b);
});

// A story's render may use hooks (some do), so each entry is drawn through
// ONE component, made once and kept, so React sees the same component each
// frame and keeps the object mounted while its knobs turn.
const components = new Map();
export function componentOf(id) {
  if (!components.has(id)) {
    const entry = ENTRY[id];
    const Story = ({ args }) => entry.render(args);
    Story.displayName = `Story(${id})`;
    components.set(id, Story);
  }
  return components.get(id);
}

// The knobs of an entry, as the inspector draws them: each argType's
// control as kind, with its label, and for a slider its bounds.
export function knobsOf(entry) {
  return Object.entries(entry.argTypes).map(([name, t]) => {
    const control = typeof t.control === "string" ? { type: t.control } : t.control ?? {};
    const kind = control.type ?? "text";
    return {
      name,
      label: t.name ?? name,
      kind,
      min: control.min,
      max: control.max,
      step: control.step,
      options: control.options ?? t.options,
    };
  });
}

export function useEntries(top, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return ENTRIES.filter((e) => !e.hidden && (!top || e.top === top) && (!q || `${e.section} ${e.name}`.toLowerCase().includes(q)));
  }, [top, search]);
}
