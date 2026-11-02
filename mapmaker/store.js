// THE MAP being made, and what the editor is doing to it.
//
// A map: `name`, its `surface` (kind and radius), `look` (the stage's daylight
// and ground color), where it is saved (`folder`, relative to this repo or
// absolute), and its `placements`, each
//
//   { id, entry, args, dir: [x, y, z], yaw, scale, lift, role }
//
// `entry` is a catalog id (catalog.js), `args` the knob values that differ
// from the entry's own, `dir` the bearing on the surface, `yaw` the turn
// about its up in radians, `scale` a multiplier and `lift` world units above
// the ground. A groundcover patch ("cover-…", ../runtime/cover.js) and a
// piece of terrain ("terrain-…", ../runtime/terrain.js: a plateau or a
// ramp) are placements too, shaped by their args. `role` is what it is to a game: "prop" (scenery, baked as it
// stands — a placed car or animal is scenery too), or "player", the one
// START the game fills itself: where you begin, and as what. The map is
// the ground's one source: a game builds its ball, its water, its cliffs
// and its roads from the map, and the editor shows the same.
//
// Every change to the placements goes through `commit`, which keeps the
// one before for undo. The map in hand is kept in localStorage, so a reload
// (every change to the code is one) comes back to it.
import * as THREE from "three";
import { create } from "zustand";
import { ENTRY } from "./catalog.js";
import { isCover, isRoad, isWater, coverType, roadKnots, coverLobes, lobeDistance, onRoadLobe, COVER } from "../runtime/cover.js";
import { isTerrain, terrainType, terrainLobes, cliffLayerAt, MAX_LAYERS, CLIFF_ARGS } from "../runtime/terrain.js";
import { growTerrain, AMOUNTS } from "./seed.js";

const KEY = "mapmaker-map";
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

export const blankMap = (name = "untitled") => ({
  version: 1,
  name,
  surface: { kind: "planet", radius: 36 },
  look: { daylight: 1, ground: "#6E9B5E" },
  folder: "maps",
  // the TERRAIN SEED (seed.js): the word the ground was last grown from, and how much of each it grows
  seed: { word: "", ...AMOUNTS },
  placements: [],
});


export const ROLES = {
  prop: { label: "scenery", color: null },
  player: { label: "player start", color: "#E0893A" },
};
// What a thing is by default, from where it sits in the catalog: the first
// character placed is the player start; everything else is scenery.
export const roleFor = (top, placements) => {
  if (top === "Characters") return placements.some((p) => p.role === "player") ? "prop" : "player";
  return "prop";
};
// One player start at most: giving it to one takes it from any other.
const withRole = (placements, id, role) =>
  placements.map((p) => (p.id === id ? { ...p, role } : role === "player" && p.role === "player" ? { ...p, role: "prop" } : p));
// A map as saved: older ones had car and mount starts, which are scenery
// now, and "plateaus", which are cliffs.
// JOINING ROADS: two open roads whose ends lie close enough to overlap (a
// road's width, and a little) are one road. `joinNearby` finds the nearest
// such road for road `id`: the knots of each, oriented so the ends meeting
// are last of this one and first of the other.
const roadWidth = (p) => p.args?.width ?? COVER.road.path.width;
export function joinNearby(placements, id, R = 36) {
  const me = placements.find((p) => p.id === id);
  if (!me || !isRoad(me.entry) || me.closed) return null;
  const A = roadKnots(me, R);
  let best = null;
  for (const q of placements) {
    if (q.id === id || !isRoad(q.entry) || q.closed) continue;
    const B = roadKnots(q, R);
    const reach = Math.max(roadWidth(me), roadWidth(q)) + 2;
    for (const flipA of [false, true])
      for (const flipB of [false, true]) {
        const a = (flipA ? A.slice().reverse() : A)[A.length - 1];
        const b = (flipB ? B.slice().reverse() : B)[0];
        const d = a.angleTo(b) * R;
        if (d <= reach && (!best || d < best.d)) best = { d, id: q.id, flipA, flipB, A: flipA ? A.slice().reverse() : A, B: flipB ? B.slice().reverse() : B };
      }
  }
  return best;
}
// The two roads as one. Where they overlap, the knots that would double back
// are dropped: the nearest pair among the last few of this one and the first
// few of the other becomes a single knot between them, nothing of either past
// it kept, and the knots round it are eased so the join has no kink.
export function joinedKnots({ A, B }) {
  const tail = Math.min(4, A.length), head = Math.min(4, B.length);
  let best = null;
  for (let i = A.length - tail; i < A.length; i++)
    for (let j = 0; j < head; j++) {
      const d = A[i].angleTo(B[j]);
      if (!best || d < best.d) best = { i, j, d };
    }
  const { i, j } = best;
  const mid = A[i].clone().add(B[j]).normalize();
  const knots = [...A.slice(0, i), mid, ...B.slice(j + 1)];
  const at = i;
  const eased = knots.map((k) => k.clone());
  for (const k of [at - 1, at, at + 1]) {
    if (k < 1 || k > knots.length - 2) continue;
    eased[k].copy(knots[k]).multiplyScalar(0.5).addScaledVector(knots[k - 1], 0.25).addScaledVector(knots[k + 1], 0.25).normalize();
  }
  return eased;
}
// A cliff placed on another is a layer above it (up to MAX_LAYERS): its `layer` is one more than the highest it lies on.
function layered(args, entry, dir, all, R) {
  if (entry !== "terrain-cliff" || args.layer !== undefined) return;
  const under = cliffLayerAt(all, dir, R);
  if (under > 0) args.layer = Math.min(MAX_LAYERS, under + 1);
}
// A placed thing whose story has moved: a car placed under Vehicles/Car
// that is now under Bug Cars, Food Cars (and so on — the catalog's vehicle
// sections) keeps its name, so it is found where it is now. A game reads
// cars by name across those sections too (the car game's carEntryOf).
const CAR_SECTIONS = ["vehicles-car-", "vehicles-ball-cars-", "vehicles-bug-cars-", "vehicles-fish-cars-", "vehicles-food-cars-"];
const moved = (entry) => {
  if (ENTRY[entry]) return entry;
  const section = CAR_SECTIONS.find((s) => entry.startsWith(s));
  if (!section) return entry;
  const rest = entry.slice(section.length);
  return CAR_SECTIONS.map((s) => s + rest).find((id) => ENTRY[id]) ?? entry;
};
// What a placed thing keeps the groundcover back round it, when the map
// does not say: a building its lot, everything else nothing.
export const clearingFor = (entry) => (ENTRY[entry]?.top === "Buildings" ? 5 : 0);
// (an older map's `terrain`, a snapshot of a game's ground, and `dismissed`,
// the game's things it once took over, are dropped: the map is the ground now)
export const tidy = ({ terrain: _snapshot, dismissed: _dismissed, ...m }) => ({
  ...blankMap(),
  ...m,
  seed: { ...blankMap().seed, ...(m.seed ?? {}) },
  placements: (m.placements ?? []).map((p) => {
    const entry = moved(p.entry === "terrain-plateau" ? "terrain-cliff" : p.entry);
    const shape = isCover(entry) || isTerrain(entry);
    const clearing = shape ? undefined : typeof p.clearing === "number" ? p.clearing : clearingFor(entry);
    return ROLES[p.role] && entry === p.entry && (shape || clearing === p.clearing) ? p : { ...p, entry, role: ROLES[p.role] ? p.role : "prop", ...(shape ? {} : { clearing }) };
  }),
});

const kept = (() => {
  try {
    const m = JSON.parse(localStorage.getItem(KEY));
    return m?.version === 1 ? tidy(m) : null;
  } catch {
    return null;
  }
})();

// A placement that is a shape on the ground (a patch, a cliff, a ramp), as
// against a thing stood on it: what the two MODES tell apart.
export const isShapeEntry = (entry) => isCover(entry) || isTerrain(entry);
export const MODES = {
  objects: { label: "objects", help: "place and move things; the ground's shapes stay out of the way" },
  terrain: { label: "terrain", help: "draw and move cliffs, ramps and groundcover; things stay out of the way" },
};
const keptMode = (() => {
  try {
    return MODES[localStorage.getItem("mapmaker-mode")] ? localStorage.getItem("mapmaker-mode") : "objects";
  } catch {
    return "objects";
  }
})();

// THE SCULPT BRUSH (Scene.jsx's sculpt): its `radius`, the `height` of
// what it raises (3.2 by default — taller than about 2.9 a cliff's edge is a
// wall, not a bank you can walk up, so it comes out as a cliff; the stock
// CLIFF_ARGS.height gives a bank), how softly its stamps run together
// (`soft`, the blend as a share of the radius) and its edge's `wobble`.
// Kept in the browser between sessions.
export const BRUSH = { radius: 4, height: 3.2, soft: 1, wobble: CLIFF_ARGS.wobble };
export const BRUSH_RANGE = { radius: [1, 16], height: [0.5, 12], soft: [0, 2], wobble: [0, 1.5] };
const keptBrush = (() => {
  try {
    return { ...BRUSH, ...(JSON.parse(localStorage.getItem("mapmaker-brush")) ?? {}) };
  } catch {
    return { ...BRUSH };
  }
})();

// The SPIN: the world turning slowly on its own, `speed` turns a minute.
// Kept in the browser between sessions, like the brush.
export const SPIN_RANGE = [0.05, 4];
const keptSpin = (() => {
  try {
    return { on: false, speed: 0.5, ...(JSON.parse(localStorage.getItem("mapmaker-spin")) ?? {}) };
  } catch {
    return { on: false, speed: 0.5 };
  }
})();

export const useMap = create((set, get) => ({
  map: kept ?? blankMap(),
  spin: keptSpin,
  setSpin: (patch) =>
    set((s) => {
      const spin = { ...s.spin, ...patch };
      spin.speed = Math.min(SPIN_RANGE[1], Math.max(SPIN_RANGE[0], +spin.speed));
      try {
        localStorage.setItem("mapmaker-spin", JSON.stringify(spin));
      } catch {}
      return { spin };
    }),
  brush: keptBrush,
  setBrush: (patch) =>
    set((s) => {
      const brush = { ...s.brush };
      for (const [k, v] of Object.entries(patch)) if (BRUSH_RANGE[k]) brush[k] = Math.min(BRUSH_RANGE[k][1], Math.max(BRUSH_RANGE[k][0], +(+v).toFixed(2)));
      try {
        localStorage.setItem("mapmaker-brush", JSON.stringify(brush));
      } catch {}
      return { brush };
    }),
  undo: [],
  redo: [],
  dirty: false,
  selected: null, // a placement's id
  placing: null, // a catalog entry's id, while placing one
  hover: null, // the bearing under the pointer, while placing
  status: "",
  // The MODE: "objects" (things) or "terrain" (the ground's shapes). Only
  // the mode's own kind can be picked, dragged or placed.
  mode: keptMode,
  setMode: (mode) =>
    set((s) => {
      if (!MODES[mode] || mode === s.mode) return s;
      const terrain = mode === "terrain";
      const sel = s.map.placements.find((p) => p.id === s.selected);
      try {
        localStorage.setItem("mapmaker-mode", mode);
      } catch {}
      return {
        mode,
        selected: sel && isShapeEntry(sel.entry) === terrain ? s.selected : null,
        placing: s.placing && isShapeEntry(s.placing) === terrain ? s.placing : null,
        hover: null,
      };
    }),

  setMap: (map) => set({ map: tidy(map), undo: [], redo: [], selected: null, placing: null, dirty: false }),
  setName: (name) => set((s) => ({ map: { ...s.map, name }, dirty: true })),
  setFolder: (folder) => set((s) => ({ map: { ...s.map, folder }, dirty: true })),
  setLook: (patch) => set((s) => ({ map: { ...s.map, look: { ...s.map.look, ...patch } }, dirty: true })),
  setSurface: (patch) => set((s) => ({ map: { ...s.map, surface: { ...s.map.surface, ...patch } }, dirty: true })),
  setSeed: (patch) => set((s) => ({ map: { ...s.map, seed: { ...s.map.seed, ...patch } }, dirty: true })),
  // THE TERRAIN SEED: the ground grown from the seed's word (seed.js) in
  // one undo step. The ground's shapes drawn by hand (cliffs, ramps,
  // patches, roads) are replaced, or kept with `keep`; things placed on
  // the map stay either way. How many pieces grew.
  grow: (keep = false) => {
    const { map, selected } = get();
    const grown = growTerrain(map.seed.word, map.surface.radius, map.seed);
    const base = keep ? map.placements : map.placements.filter((p) => !isShapeEntry(p.entry));
    get().commit([...base, ...grown]);
    // the roads that grew lie over everything: what was kept under them goes too (within the one step)
    for (const g of grown) if (isRoad(g.entry)) get().clearUnderRoad(g.id);
    set((s) => ({ selected: s.map.placements.some((p) => p.id === selected) ? selected : null, placing: null, hover: null }));
    return grown.length;
  },
  // A placement made into another entry where it stands (the player swapped for another character); its knobs start over.
  setEntry: (id, entry) => get().commit(get().map.placements.map((p) => (p.id === id ? { ...p, entry, args: {} } : p))),
  setRole: (id, role) => get().commit(withRole(get().map.placements, id, role)),
  select: (selected) => set({ selected, placing: null, knot: null }),
  // Picking a thing to place puts the editor in that thing's mode.
  startPlacing: (placing) => set({ placing, selected: null, mode: isShapeEntry(placing) ? "terrain" : "objects" }),
  stopPlacing: () => set({ placing: null, hover: null }),
  setHover: (hover) => set({ hover }),
  say: (status) => set({ status }),

  // The placements replaced, the ones before kept for undo.
  commit: (placements) =>
    set((s) => ({
      map: { ...s.map, placements },
      undo: [...s.undo.slice(-99), s.map.placements],
      redo: [],
      dirty: true,
    })),
  // A change that is still going (a drag, a slider): no undo step until it
  // ends. beginLive keeps the placements as they were; endLive makes that
  // the undo step, if anything changed.
  liveBefore: null,
  focus: null, // set by the scene: (id) brings the camera to that placement
  patchLive: (id, patch) =>
    set((s) => ({ map: { ...s.map, placements: s.map.placements.map((p) => (p.id === id ? { ...p, ...patch } : p)) } })),
  patchArgsLive: (id, args) =>
    set((s) => ({ map: { ...s.map, placements: s.map.placements.map((p) => (p.id === id ? { ...p, args: { ...p.args, ...args } } : p)) } })),
  beginLive: () => set((s) => (s.liveBefore ? s : { liveBefore: s.map.placements })),
  endLive: () =>
    set((s) => {
      if (!s.liveBefore) return s;
      const changed = s.liveBefore !== s.map.placements;
      return { liveBefore: null, ...(changed ? { undo: [...s.undo.slice(-99), s.liveBefore], redo: [], dirty: true } : {}) };
    }),

  place: (entry, dir, extra = {}) => {
    const all = get().map.placements;
    const role = extra.role ?? roleFor(ENTRY[entry]?.top, all);
    // the size the last one of this kind was given, so a row of trees comes out even
    const like = [...all].reverse().find((p) => p.entry === entry);
    // a road takes the last road's width and verge, so one road reads like the next
    const args = isRoad(entry) && like ? { ...like.args } : {};
    layered(args, entry, dir, all, get().map.surface.radius);
    const shape = isCover(entry) || isTerrain(entry);
    const p = { id: uid(), entry, args, dir, yaw: 0, scale: shape ? 1 : like?.scale ?? 1, lift: 0, ...(shape ? {} : { clearing: like?.clearing ?? clearingFor(entry) }), ...extra, role };
    get().commit(withRole([...all, p], p.id, p.role));
    return p.id;
  },
  // As `place`, but as a change still going (a stroke being drawn): no undo
  // step of its own — endLive makes the one step for the whole stroke.
  placeLive: (entry, dir, extra = {}) => {
    get().beginLive();
    const all = get().map.placements;
    const like = [...all].reverse().find((p) => p.entry === entry);
    const args = isRoad(entry) && like ? { ...like.args } : {};
    layered(args, entry, dir, all, get().map.surface.radius);
    const p = { id: uid(), entry, args, dir, yaw: 0, scale: 1, lift: 0, role: "prop", ...extra };
    set((s) => ({ map: { ...s.map, placements: [...s.map.placements, p] } }));
    return p.id;
  },
  // A placement taken off as a change still going (a sculpt stroke's): endLive makes the one undo step.
  removeLive: (id) => {
    get().beginLive();
    set((s) => ({ map: { ...s.map, placements: s.map.placements.filter((p) => p.id !== id) }, selected: s.selected === id ? null : s.selected }));
  },
  // A road's knot picked (its index), to drag or delete; none with null.
  knot: null,
  selectKnot: (knot) => set({ knot }),
  // Stacking: the placements lie in list order, later on top. A groundcover
  // patch laid over one of another type clears it where they overlap.
  toTop: (id) => {
    const all = get().map.placements;
    const p = all.find((p) => p.id === id);
    if (p && all[all.length - 1] !== p) get().commit([...all.filter((q) => q !== p), p]);
  },
  toBottom: (id) => {
    const all = get().map.placements;
    const p = all.find((p) => p.id === id);
    if (p && all[0] !== p) get().commit([p, ...all.filter((q) => q !== p)]);
  },
  // The game's houses and trees taken onto the map (those not already on it, or sent away).
  patch: (id, patch) => get().commit(get().map.placements.map((p) => (p.id === id ? { ...p, ...patch } : p))),
  patchArgs: (id, args) => get().commit(get().map.placements.map((p) => (p.id === id ? { ...p, args: { ...p.args, ...args } } : p))),
  resetArgs: (id) => get().commit(get().map.placements.map((p) => (p.id === id ? { ...p, args: {} } : p))),
  // Join road `id` to the road its end overlaps (see joinNearby): one road, this one's width and verge, the other gone. Returns whether it did.
  joinRoad: (id) => {
    const all = get().map.placements;
    const j = joinNearby(all, id, get().map.surface.radius);
    if (!j) return false;
    const knots = joinedKnots(j).map((k) => k.toArray());
    get().commit(all.filter((p) => p.id !== j.id).map((p) => (p.id === id ? { ...p, knots, dir: knots[0], closed: false } : p)));
    return true;
  },
  // The things under road `id` — on its tarmac or its verge — taken off
  // the map: the placed things (a tree, a bench, a car) standing on it,
  // not the player start; and the ground's own shapes it runs over — a
  // patch of grass, flowers, pebbles or bare ground, a cliff, a dirt ramp
  // — whole, since a road lies over everything. Water stays: a road over
  // water is a bridge. Other roads stay: roads cross. Set live, within
  // whatever edit is in hand, so it undoes with the road. Returns how
  // many went.
  clearUnderRoad: (id) => {
    const all = get().map.placements;
    const R = get().map.surface.radius;
    const road = coverLobes(all.filter((p) => p.id === id), R)[0];
    if (!road || road.type !== "road") return 0;
    const reach = road.width / 2 + road.verge;
    // a shape the road's tarmac or verge overlaps anywhere along it
    const shapes = new Map([...coverLobes(all, R), ...terrainLobes(all, R)].map((l) => [l.id, l]));
    const overlaps = (l) => road.samples.some((s) => lobeDistance(l, s.dir) < reach);
    const under = (p) => {
      if (p.id === id || p.role === "player") return false;
      if (isCover(p.entry)) return !isRoad(p.entry) && !isWater(coverType(p.entry)) && !!shapes.get(p.id) && overlaps(shapes.get(p.id));
      if (isTerrain(p.entry)) return !(terrainType(p.entry) === "ramp" && p.args?.road) && !!shapes.get(p.id) && overlaps(shapes.get(p.id));
      return onRoadLobe(road, new THREE.Vector3().fromArray(p.dir).normalize());
    };
    const gone = all.filter(under);
    if (!gone.length) return 0;
    set((s) => ({ map: { ...s.map, placements: s.map.placements.filter((p) => !under(p)) } }));
    if (gone.some((p) => p.id === get().selected)) set({ selected: null });
    return gone.length;
  },
  remove: (id) => {
    get().commit(get().map.placements.filter((p) => p.id !== id));
    if (get().selected === id) set({ selected: null });
  },
  // several at once (a cliff's whole shape, Terrain.jsx's shapeOf), one undo step
  removeMany: (ids) => {
    const gone = new Set(ids);
    get().commit(get().map.placements.filter((p) => !gone.has(p.id)));
    if (gone.has(get().selected)) set({ selected: null });
  },
  duplicate: (id) => {
    const p = get().map.placements.find((p) => p.id === id);
    if (!p) return;
    // a second player start would take the first's place: the copy is scenery
    const copy = { ...p, id: uid(), args: { ...p.args }, dir: [...p.dir], role: p.role === "player" ? "prop" : p.role };
    get().commit([...get().map.placements, copy]);
    set({ selected: copy.id });
    return copy.id;
  },
  undoStep: () =>
    set((s) => {
      if (!s.undo.length) return s;
      const prev = s.undo[s.undo.length - 1];
      return { map: { ...s.map, placements: prev }, undo: s.undo.slice(0, -1), redo: [...s.redo, s.map.placements], dirty: true, selected: prev.some((p) => p.id === s.selected) ? s.selected : null };
    }),
  redoStep: () =>
    set((s) => {
      if (!s.redo.length) return s;
      const next = s.redo[s.redo.length - 1];
      return { map: { ...s.map, placements: next }, redo: s.redo.slice(0, -1), undo: [...s.undo, s.map.placements], dirty: true };
    }),
  clear: () => get().commit([]),
}));

// Kept in the browser as it changes.
useMap.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s.map));
  } catch {}
});
