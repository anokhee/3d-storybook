// THE ROOMS the editor furnishes, and what can be put in them.
//
// A ROOM is one of the catalog's Shopfronts entries seen from inside: a
// shop of each kind (its Interior story: Shopfronts/Café/Interior…) and
// the Alleyway with its back room. Each has the story's own knobs
// (knobStory, as the story itself is made: stories/helpers/shopfronts.jsx)
// so what is loaded here is what the storybook shows, and `configOf(args)`
// gives the config the noun takes — the one that is copied out, with the
// layout laid in it.
//
// The PALETTE is what can be added to a room: the plan's own kinds of item
// (a Shop Interior's Furniture, an alley's Thing), each with the fields it
// starts with; FIELDS says what the inspector offers to change on each.
import { SHOPFRONT, SHOPFRONT_KINDS } from "../src/nouns/shopfront/objects.js";
import { SHOP_INTERIOR, SHOP_KINDS, shopInteriorKnobsOf, interiorOf, planOf } from "../src/nouns/shopInterior/objects.js";
import { ALLEY, ALLEY_KNOBS, alleyPlanOf } from "../src/nouns/alley/objects.js";
import { GOODS_STYLES } from "../src/nouns/shopfront/display.js";
import { PLANT_KINDS } from "../src/nouns/potPlant/objects.js";
import { WINDOW_BOX_PLANTS } from "../src/nouns/windowBox/objects.js";
import { WALL_HANGING_KIND_NAMES } from "../src/nouns/wallHanging/objects.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "../stories/helpers/knobs.js";
import { ENTRY, knobsOf as catalogKnobsOf } from "../mapmaker/catalog.js";

export const ALLEY_ID = "alleyway";
const slug = (kind) => kind.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
const titleCase = (t) => t.replace(/(^|[\s-])(\p{Ll})/gu, (m, a, c) => a + c.toUpperCase());

// A shop of each kind, as its Interior story; the alley as its Back Room story
function shopOf(kind) {
  const S = merge(SHOPFRONT, SHOPFRONT_KINDS[kind] ?? {});
  const styled = kind === "café" || kind === "florist";
  const K = knobStory(SHOP_INTERIOR, shopInteriorKnobsOf(kind), { kind }, {
    size: 2, doorSide: S.door.side, awning: S.awning.on, garland: S.garland.on, decoration: S.shopWindow.decoration,
    // (a café's or florist's awning and decoration start unset, so its style has its own: as the story does)
    ...(styled ? { awning: undefined, decoration: undefined } : {}),
  });
  return {
    id: kind,
    kind,
    label: titleCase(kind),
    thumb: `/thumbs/shopfronts-${slug(kind)}--interior.png`,
    knobs: K.knobs,
    args: K.args,
    alley: false,
    // the config the noun takes: knobs left blank are left out, so a style colours them (as the story does)
    configOf: (args) => K.configOf(Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined && v !== null && v !== ""))),
    planOf: (config, layout) => planOf(interiorOf(config), layout),
    // the layout the storybook already has for it (a style's, or the kind's own: KIND_LAYOUTS), to carry on from
    baseLayoutOf: (config) => interiorOf(config).layout,
  };
}
function alleyOf() {
  const K = knobStory(ALLEY, ALLEY_KNOBS, {}, { sides: true, bins: 2, room: true, roomKind: "storage" });
  return {
    id: ALLEY_ID,
    kind: ALLEY_ID,
    label: "Alleyway",
    thumb: "/thumbs/shopfronts-alleyway--back-room.png",
    knobs: K.knobs,
    args: K.args,
    alley: true,
    configOf: (args) => K.configOf(args),
    planOf: (config, layout) => alleyPlanOf(merge(ALLEY, config), layout),
    baseLayoutOf: (config) => merge(ALLEY, config).layout,
  };
}
export const ROOMS = [...SHOP_KINDS.map(shopOf), alleyOf()];
export const ROOM = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

// The room's measures the editor works in, from its plan: the floor's
// reach (`x0..x1`, `z0..z1`, the kitchen or back room counted, and the
// pavement out front), the walls' faces (`wall`: left, right, back), the
// ceiling `h`. For the inspector's ranges, the grid, the snap to a wall.
export function boundsOf(plan, room) {
  const R = plan.room;
  if (room.alley) {
    const H = plan.warehouse, W = H ? Math.max(R.W, H.W) : R.W;
    return { x0: -W / 2, x1: W / 2, z0: H ? H.zb : R.zb, z1: 0.6, h: H?.H ?? 2.4, wall: { left: -(H ? H.W : R.W) / 2, right: (H ? H.W : R.W) / 2, back: H ? H.zb : R.zb } };
  }
  const K = R.kitchen, face = R.iw + 0.03;
  const B = { x0: -R.W / 2, x1: R.W / 2, z0: K ? K.zb : R.zb, z1: 2.0, h: R.h, wall: { left: -face, right: face, back: R.zb } };
  // out into the rooms through the side walls, too (a back one is the `kitchen` already)
  for (const it of plan.items) {
    if (it.t !== "room") continue;
    if (Math.abs(it.x + (R.W / 2 - 0.06)) < 0.25) B.x0 = Math.min(B.x0, it.x - 0.12 - it.deep);
    if (Math.abs(it.x - (R.W / 2 - 0.06)) < 0.25) B.x1 = Math.max(B.x1, it.x + 0.12 + it.deep);
    if (Math.abs(it.z - (R.zb - 0.06)) < 0.25) B.z0 = Math.min(B.z0, it.z - 0.12 - it.deep);
  }
  return B;
}

// THE PALETTE: what can be added, by room. `make()` gives the item's own
// fields (its place is where it is clicked down); the plan fills in the
// rest (planOf's filledOf, alleyPlanOf's fill). `wall` marks what hangs on
// or stands against a wall (the inspector's "snap to wall"), with how far
// in from the wall's face its origin sits.
const shopThings = [
  { group: "seating & tables", t: "cafe", label: "café table", make: () => ({ chairs: 2 }) },
  { group: "seating & tables", t: "table", label: "table", make: () => ({ w: 4, l: 2.4 }) },
  { group: "seating & tables", t: "chair", label: "armchair", make: () => ({}) },
  { group: "seating & tables", t: "keeper", label: "stool", make: () => ({}) },
  { group: "seating & tables", t: "rug", label: "rug", make: () => ({ w: 6, l: 4 }) },
  { group: "counters & shelves", t: "counter", label: "counter", make: () => ({ w: 6 }) },
  { group: "counters & shelves", t: "kcounter", label: "worktop", make: () => ({ w: 4, kind: "plain", front: true }) },
  { group: "counters & shelves", t: "kcounter", label: "sink", make: () => ({ w: 4, kind: "sink" }) },
  { group: "counters & shelves", t: "kcounter", label: "stove", make: () => ({ w: 3.5, kind: "plain", stove: true, pot: true, pan: true }) },
  { group: "counters & shelves", t: "goods", label: "shelves", make: () => ({ g: { style: "boxes", x0: -0.6, x1: 0.6, depth: 0.28, shelves: [0.3, 0.75, 1.2, 1.65] } }) },
  { group: "counters & shelves", t: "fridge", label: "fridge", make: () => ({}) },
  { group: "counters & shelves", t: "cooler", label: "cooler", make: () => ({ len: 1, h: 1.9, d: 0.55 }), wall: 0 },
  { group: "plants & light", t: "plant", label: "pot plant", make: () => ({ kind: "bush", size: 1 }) },
  { group: "plants & light", t: "tall", label: "tall plant", make: () => ({}) },
  { group: "plants & light", t: "lamp", label: "stick lamp", make: () => ({}) },
  { group: "plants & light", t: "light", label: "pendant light", make: (B) => ({ y: B.h }) },
  { group: "in the wall", t: "door", label: "door", make: () => ({ width: 0.8, height: 1.85, curve: 0 }), wall: -0.06, snap: true },
  { group: "in the wall", t: "arch", label: "archway", make: () => ({ width: 1.1, height: 2.1, curve: 1 }), wall: -0.06, snap: true },
  { group: "in the wall", t: "window", label: "window", make: () => ({ y: 0.95, w: 0.5, h: 1.25, top: 1, bars: true }), wall: -0.06, snap: true },
  { group: "in the wall", t: "room", label: "room through it", make: () => ({ width: 3, deep: 2.5, opening: { width: 1.0, height: 2.0, curve: 1 }, door: false }), wall: -0.06, snap: true },
  { group: "on the wall", t: "hanging", label: "wall hanging", make: () => ({ y: 1.7, art: "picture" }), wall: 0.04 },
  { group: "on the wall", t: "planter", label: "wall planter", make: () => ({ y: 1.3, kind: "ivy" }), wall: 0.005 },
  { group: "on the wall", t: "clock", label: "clock", make: () => ({ y: 2.1 }), wall: 0.02 },
  { group: "on the wall", t: "mirror", label: "salon mirror", make: () => ({}), wall: 0 },
  { group: "on the wall", t: "mailboxes", label: "mailboxes", make: () => ({}), wall: 0 },
  { group: "on the wall", t: "elevator", label: "lift doors", make: () => ({}), wall: 0 },
  { group: "salon", t: "salon", label: "salon chair", make: () => ({}) },
  { group: "salon", t: "basin", label: "wash basin", make: () => ({}), wall: 0 },
  { group: "people", t: "host", label: "someone standing", make: () => ({}) },
];
const alleyThings = [
  { group: "alley", t: "bin", label: "wheelie bin", make: () => ({}) },
  { group: "back room", t: "shelving", label: "shelving", make: () => ({ width: 2, depth: 0.45, seed: 1 }), wall: 0 },
  { group: "back room", t: "crate", label: "crates", make: () => ({ n: 2, size: 0.55 }) },
  { group: "back room", t: "chair", label: "chair", make: () => ({}) },
  { group: "back room", t: "bulb", label: "bare bulb", make: (B) => ({ y: B.h, cord: 0.5 }) },
  { group: "back room", t: "clock", label: "clock", make: () => ({ y: 2.0 }), wall: 0.01 },
];
export const paletteOf = (room) => (room.alley ? alleyThings : shopThings);
// what hangs on a wall, by kind: how far in from the face its origin sits
// (a door's, half the wall's thickness back: its foot on the wall's middle);
// `snap` has it put to the wall as soon as it is set down (see snapToWall)
export const WALL_IN = Object.fromEntries([...shopThings, ...alleyThings].filter((p) => p.wall != null).map((p) => [p.t, p.wall]));

// A kind's name, for the inspector's title
const NAMES = {
  cafe: "café table", kcounter: "worktop", goods: "shelves", keeper: "stool", host: "someone standing", chef: "the chef", tall: "tall plant", plant: "pot plant",
  light: "pendant light", hanging: "wall hanging", planter: "wall planter", salon: "salon chair", basin: "wash basin", elevator: "lift doors", dishes: "crockery", board: "cutting board",
  bin: "wheelie bin", crate: "crates", bulb: "bare bulb", lamp: "stick lamp", chair: "chair", door: "door in the wall", arch: "archway", window: "window", room: "room through the wall",
};
export const nameOf = (it) => (it.t === "object" ? ENTRY[it.entry]?.name ?? it.entry : NAMES[it.t] ?? it.t);

// AN OBJECT PASTED FROM THE CATALOG: what the storybook's "Copy knobs"
// puts on the clipboard ({ story, id, knobs }), as a thing to set down
// (a palette entry: see paletteOf) — an "object" item of that entry, its
// knobs as copied, at the shops' furniture scale if it is furniture (the
// library's furniture is built in its own units), or as it is (a
// character, an animal, a tree, a vehicle stand beside the characters already)
const OWN_UNITS = new Set(["Furniture", "Lighting", "Fixtures", "Food", "Machines", "Machine Parts", "Instruments", "Toys", "Props", "Primitives", "Ornaments", "Misc", "Flooring", "Shopfronts"]);
export function pastedObjectOf(data) {
  const id = data?.id;
  const entry = id && ENTRY[id];
  if (!entry) return null;
  const args = { ...(data.knobs ?? data.args ?? {}) };
  for (const k of Object.keys(args)) if (args[k] === null) delete args[k];
  return { t: "object", label: entry.name, group: "pasted", make: () => ({ entry: id, args, scale: OWN_UNITS.has(entry.top) ? 0.27 : 1, y: 0 }) };
}
// an object item's own fields: its size, and the entry's knobs, into `args`
export const objectFieldsOf = (it) => {
  const entry = ENTRY[it.entry];
  const out = [range("scale", "size", 0.05, 3, 0.01)];
  if (!entry) return out;
  for (const k of catalogKnobsOf(entry)) {
    const path = `args.${k.name}`;
    if (k.kind === "color") out.push(color(path, k.label));
    else if (k.kind === "select" || k.kind === "radio" || k.kind === "inline-radio") out.push(options(path, k.label, k.options ?? []));
    else if (k.kind === "boolean") out.push(bool(path, k.label));
    else if (k.kind === "range" || k.kind === "number") out.push(range(path, k.label, k.min ?? 0, k.max ?? 10, k.step ?? 0.1));
  }
  return out;
};

// THE FIELDS the inspector offers on an item, by kind, over its place and
// turn (every item's) and its height (`y`, for what hangs): each
//   { path, label, kind: "range" [min, max, step] | "options" | "color" | "bool" }
// `path` into the item ("g.style" into its goods)
const range = (path, label, min, max, step = 0.05) => ({ path, label, kind: "range", min, max, step });
const options = (path, label, opts) => ({ path, label, kind: "options", options: opts });
const color = (path, label) => ({ path, label, kind: "color" });
const bool = (path, label) => ({ path, label, kind: "bool" });
export const FIELDS = {
  cafe: [range("chairs", "chairs", 1, 4, 1)],
  counter: [range("w", "width", 2, 12, 0.5), options("under", "underneath", ["plain", "cupboard", "oven", "dishwasher"])],
  kcounter: [range("w", "width", 1.5, 12, 0.5), options("kind", "kind", ["plain", "sink"]), options("under", "underneath", ["plain", "cupboard", "oven", "dishwasher"]), bool("front", "in the shop's colours"), bool("stove", "stove rings"), bool("pot", "a pot on it"), bool("pan", "a pan on it")],
  table: [range("w", "width", 2, 8, 0.5), range("l", "length", 1, 6, 0.5)],
  rug: [range("w", "width", 2, 14, 0.5), range("l", "length", 2, 12, 0.5)],
  plant: [options("kind", "plant", PLANT_KINDS), range("size", "size", 0.5, 1.6, 0.05), color("pot", "pot colour"), color("color", "bloom colour")],
  tall: [color("pot", "pot colour"), color("leaves", "leaves"), color("stem", "stem")],
  goods: [options("g.style", "goods", [...GOODS_STYLES, "cafe", "kitchen"]), range("g.x1", "half length", 0.2, 2.5, 0.05), range("g.depth", "depth", 0.15, 0.6, 0.01), range("lift", "lift", 0, 1.5, 0.01)],
  door: [range("width", "width", 0.6, 1.3, 0.05), range("height", "height", 1.5, 2.3, 0.05), range("curve", "arched head", 0, 1, 0.05), range("open", "swung open", -1, 1, 0.05)],
  arch: [range("width", "width", 0.6, 2.5, 0.05), range("height", "height", 1.5, 2.6, 0.05), range("curve", "arched head", 0, 1, 0.05)],
  window: [range("w", "width", 0.3, 2.5, 0.05), range("h", "height", 0.3, 2.2, 0.05), range("top", "arched head", 0, 1, 0.05), bool("bars", "glazing bars")],
  room: [range("width", "width", 1.5, 6, 0.1), range("deep", "deep", 1, 5, 0.1), range("height", "height", 1.8, 3.5, 0.05), color("floor", "floor colour"),
    range("opening.width", "opening width", 0.6, 2.5, 0.05), range("opening.height", "opening height", 1.5, 2.6, 0.05), range("opening.curve", "arched head", 0, 1, 0.05), bool("door", "a door in it"), range("open", "door swung open", -1, 1, 0.05)],
  hanging: [options("art", "art", WALL_HANGING_KIND_NAMES)],
  planter: [options("kind", "plant", WINDOW_BOX_PLANTS)],
  cooler: [range("len", "length", 0.5, 4, 0.1), range("h", "height", 1, 2.2, 0.05), range("d", "depth", 0.3, 0.8, 0.05)],
  salon: [range("lean", "tipped back (°)", 0, 40, 1)],
  mailboxes: [range("cfg.cols", "columns", 2, 7, 1), range("cfg.rows", "rows", 2, 7, 1), range("hang", "hung at", 0.3, 1.5, 0.05)],
  bin: [range("size", "size", 0.3, 0.7, 0.01), color("color", "colour")],
  shelving: [range("width", "width", 0.8, 4, 0.1), range("depth", "depth", 0.3, 0.7, 0.01), range("seed", "seed", 1, 50, 1)],
  crate: [range("n", "high", 1, 3, 1), range("size", "size", 0.35, 0.7, 0.01)],
  bulb: [range("cord", "cord", 0.2, 1.4, 0.05), bool("dim", "dim")],
};
// a goods display's `x1` field is its half length: `x0` follows as its mirror (see Panel's setField)
export const MIRRORED = { "g.x1": "g.x0" };

export const getPath = (o, path) => path.split(".").reduce((v, k) => v?.[k], o);
// `v` at `path` in a fresh copy of `o` (one level of an object field kept, as furnish.js's patched merges it)
export const setPath = (o, path, v) => {
  const [k, ...rest] = path.split(".");
  if (!rest.length) return { ...o, [k]: v };
  return { ...o, [k]: setPath(o?.[k] ?? {}, rest.join("."), v) };
};
// a colour field's hex, whichever way the item holds it (a hex, a swatch, or nothing)
export const hexOf = (v) => (typeof v === "string" ? v : v?.hex) ?? "#888888";
