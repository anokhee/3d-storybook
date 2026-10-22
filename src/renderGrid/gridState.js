// What the grid deals FROM — which presets are ticked on each axis, which
// phase is under the tuning knobs, and the sweep/flat/mouth flags — and how
// that round-trips through the URL query string. Pure: no three, no DOM, no
// scene, so the vanilla grid and the R3F one read and write the same state
// the same way.
import { BANDS } from "../presets/index.js";

export const GRID_LAYOUT = {
  count: 8, // how many dolls are dealt per page
  cols: 4, // fixed column count; dolls past this wrap into extra rows
  airGap: 0.7, // vertical space between a doll's chin and the crown below it
  colGap: 0.9, // horizontal space between two neighboring columns
  fitMargin: 1.06, // camera-fit padding so the wall doesn't touch the frame edge
};

const MOUTHS = { smile: true, frown: true };

// Every phase randomConfig() sweeps/flattens against — see the `phase = "..."`
// assignments in buildOneDolly.js. "head" is the default when ?tab= is absent
// or unrecognised.
export const TAB_IDS = [
  "head",
  "body",
  "limb",
  "hair",
  "texture",
  "material",
  "face",
];

// maps each preset to its respective parameter band in presets/model/...
export const AXES = {
  heads: { param: "head", table: BANDS.heads },
  bodies: { param: "body", table: BANDS.bodies },
  limbs: { param: "limb", table: BANDS.limbs },
  antennae: { param: "hair", table: BANDS.hairs },
  textures: { param: "texture", table: BANDS.textures },
  colors: { param: "color", table: BANDS.colors },
};

// to omit all but one, write { only: ["[enabled preset]"] }
const OMITTED_PRESETS = {
  heads: ["acorn", "zucchini", "squash", "pear", "grape", "eggplant"],
  bodies: null,
  limbs: null,
  antennae: null,
  textures: ["smooth"],
  colors: null,
  mouths: null,
};

// subtracts omisions from an axis's default keys
export function defaultsFor(name, table) {
  const omit = OMITTED_PRESETS[name] ?? [];
  if (Array.isArray(omit))
    return Object.keys(table).filter((k) => !omit.includes(k));
  return omit.only.filter((k) => Object.hasOwn(table, k));
}

// Turns a query string (?head=...&mouth=... etc.) into the state object that
// controls what gets dealt onto the grid. An empty string is the defaults.
export function readState(search = "") {
  const q = new URLSearchParams(search);
  const pick = (key, table, fallback) => {
    const raw = q.get(key);
    if (raw === null) return new Set(fallback);
    if (raw === "all") return new Set(Object.keys(table));
    const keys = raw.split(",").filter((k) => {
      if (Object.hasOwn(table, k)) return true;
      console.warn(`unknown ${key} preset "${k}" — ignored`);
      return false;
    });
    return new Set(keys.length ? keys : fallback);
  };
  return {
    ...Object.fromEntries(
      Object.entries(AXES).map(([name, { param, table }]) => [
        name,
        pick(param, table, defaultsFor(name, table)),
      ]),
    ),
    tab: TAB_IDS.includes(q.get("tab")) ? q.get("tab") : "head",
    mouth:
      defaultsFor("mouths", MOUTHS).includes(q.get("mouth")) ?
        q.get("mouth")
      : null,
    sweep: q.get("mode") === "sweep",
    flatten: q.get("flat") === "1",
    suit: q.get("suit") === "1",
  };
}

// The inverse: the query string for a state, layered over whatever else is
// already in `search`. An axis param is dropped when it matches the defaults,
// so a pristine panel leaves a pristine address bar.
export function writeState(state, search = "") {
  const q = new URLSearchParams(search);
  for (const [name, { param, table }] of Object.entries(AXES)) {
    const set = state[name];
    const defaults = defaultsFor(name, table);
    if (set.size === defaults.length && defaults.every((k) => set.has(k)))
      q.delete(param);
    else if (set.size === Object.keys(table).length) q.set(param, "all");
    else q.set(param, [...set].join(","));
  }
  if (state.tab !== "head") q.set("tab", state.tab);
  else q.delete("tab");
  if (state.sweep) q.set("mode", "sweep");
  else q.delete("mode");
  if (state.flatten) q.set("flat", "1");
  else q.delete("flat");
  if (state.suit) q.set("suit", "1");
  else q.delete("suit");
  return q.toString();
}
