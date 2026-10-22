// KNOBS: an object's knobs live beside its settings, in its objects.js, as
// <NAME>_KNOBS, in the dollies editor's own field format (src/level/EditPanel.jsx
// there, PARAMS), so the catalog and the game's edit panel read one list:
//
//   { label: "wall", path: "body.wallHeight", step: 0.5 }          a slider into that field
//   { label: "walls", path: "body.color.hex", color: true }        a color picker (the path ends in .hex; the swatch is written)
//   { label: "kind", path: "kind", options: KINDS }                a pick list
//   { label: "lit", path: "lit", bool: true, on: true, off: false }  a switch
//   `min` and `max` bound a slider (else 0, and three times the default); `path` may be a list
//   of fields, one knob writing them all; `also: { "backFrame.apart": (w) => w / 2 - 0.5 }` has
//   the knob write other fields as a function of its value (a bench's back follows its seat).
//   A keyed form is read too: { argName: { path, range: [min, max, step], color, ... } }.
//
// knobStory(DEFAULTS, KNOBS, fixed, overrides) turns that into what a story
// needs: `argTypes` (the controls), `args` (the starting values, read from
// DEFAULTS, so the Default entry is the object as made) and `configOf(args)`,
// the nested config the component takes, with the colors wrapped as
// swatches, laid over `fixed` (what the story pins: a plant's kind).
// `overrides` are starting args that differ from the settings'.
import { solid, block } from "../../src/world/palette.js";

const get = (o, path) => path.split(".").reduce((v, k) => v?.[k], o);
const set = (o, path, v) => {
  const ks = path.split(".");
  let t = o;
  for (const k of ks.slice(0, -1)) t = t[k] ??= {};
  t[ks[ks.length - 1]] = v;
};
const copy = (o) => (Array.isArray(o) ? o.map(copy) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, copy(v)])) : o);
const camel = (path) => path.replace(/\.hex$/, "").split(".").map((s, i) => (i ? s[0].toUpperCase() + s.slice(1) : s)).join("");
const round = (v, step) => +(Math.round(v / step) * step).toFixed(6); // and no 13.200000000000001

// Every knob as { name, paths (without .hex), kind, ... }, whichever form it came in
function normal(KNOBS) {
  const list = Array.isArray(KNOBS) ? KNOBS.map((k) => [null, k]) : Object.entries(KNOBS);
  return list.map(([key, k]) => {
    const paths = (Array.isArray(k.path) ? k.path : [k.path]).map((p) => p.replace(/\.hex$/, ""));
    const name = key ?? camel(paths[0]);
    const label = k.label ?? k.name;
    const also = k.also ?? {};
    if (k.color) return { name, label, paths, also, kind: "color", block: k.color === "block" };
    if (k.options) return { name, label, paths, also, kind: "options", options: k.options };
    if (k.bool || k.boolean) return { name, label, paths, also, kind: "bool", on: k.on ?? true, off: k.off ?? false };
    const step = k.step ?? k.range?.[2] ?? 0.1;
    return { name, label, paths, also, kind: "range", step, min: k.min ?? k.range?.[0], max: k.max ?? k.range?.[1], value: k.value };
  });
}

export function knobStory(DEFAULTS, KNOBS, fixed = {}, overrides = {}) {
  const knobs = normal(KNOBS);
  const argTypes = {}, args = {};
  for (const k of knobs) {
    const v = k.value ?? get(DEFAULTS, k.paths[0]);
    if (k.kind === "color") { argTypes[k.name] = { control: "color" }; args[k.name] = v?.hex ?? v; }
    else if (k.kind === "options") { argTypes[k.name] = { control: "select", options: k.options }; args[k.name] = v; }
    else if (k.kind === "bool") { argTypes[k.name] = { control: "boolean" }; args[k.name] = v === k.on; }
    else {
      const d = typeof v === "number" ? v : 0;
      const min = k.min ?? (d < 0 ? round(d * 3, k.step) : 0);
      const max = k.max ?? (d > 0 ? round(d * 3, k.step) : k.step * 24);
      argTypes[k.name] = { control: { type: "range", min, max: Math.max(max, min + k.step), step: k.step } };
      args[k.name] = d;
    }
    if (k.label) argTypes[k.name].name = k.label;
  }
  Object.assign(args, overrides);
  const configOf = (a) => {
    const c = copy(fixed);
    for (const k of knobs) {
      if (!(k.name in a)) continue;
      const v = k.kind === "color" ? (k.block ? block(a[k.name]) : solid(a[k.name])) : k.kind === "bool" ? (a[k.name] ? k.on : k.off) : a[k.name];
      for (const p of k.paths) set(c, p, v);
      for (const [p, f] of Object.entries(k.also)) set(c, p, f(a[k.name]));
    }
    return c;
  };
  return { argTypes, args, configOf, knobs };
}
