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
// START the game fills itself: where you begin, and as what. `terrain`
// names a snapshot of a game's ground (a glb in the map's folder, which the
// game exports) to lay things out on and see, or "" for the plain ball.
//
// Every change to the placements goes through `commit`, which keeps the
// one before for undo. The map in hand is kept in localStorage, so a reload
// (every change to the code is one) comes back to it.
import * as THREE from "three";
import { create } from "zustand";
import { ENTRY } from "./catalog.js";
import { isCover, isRoad, roadKnots, COVER } from "../runtime/cover.js";
import { isTerrain, cliffLayerAt, MAX_LAYERS } from "../runtime/terrain.js";
import { growTerrain, AMOUNTS } from "./seed.js";

const KEY = "mapmaker-map";
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

export const blankMap = (name = "untitled") => ({
  version: 1,
  name,
  surface: { kind: "planet", radius: 36 },
  look: { daylight: 1, ground: "#6E9B5E" },
  folder: "maps",
  terrain: "terrain",
  // the TERRAIN SEED (seed.js): the word the ground was last grown from, and how much of each it grows
  seed: { word: "", ...AMOUNTS },
  placements: [],
  dismissed: [], // adopted things (ids from the game's adopt.json) taken off the map, not to be offered again
});

// The game's own houses and trees, offered through adopt.json beside its
// terrain, are told by their ids.
export const isAdopted = (id) => String(id).startsWith("adopt-");

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
export const tidy = (m) => ({
  ...blankMap(),
  ...m,
  seed: { ...blankMap().seed, ...(m.seed ?? {}) },
  placements: (m.placements ?? []).map((p) => {
    const entry = p.entry === "terrain-plateau" ? "terrain-cliff" : p.entry;
    return ROLES[p.role] && entry === p.entry ? p : { ...p, entry, role: ROLES[p.role] ? p.role : "prop" };
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

export const useMap = create((set, get) => ({
  map: kept ?? blankMap(),
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
  setTerrain: (terrain) => set((s) => ({ map: { ...s.map, terrain }, dirty: true })),
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
    set((s) => ({ selected: s.map.placements.some((p) => p.id === selected) ? selected : null, placing: null, hover: null }));
    return grown.length;
  },
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
    const p = { id: uid(), entry, args, dir, yaw: 0, scale: isCover(entry) || isTerrain(entry) ? 1 : like?.scale ?? 1, lift: 0, ...extra, role };
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
  adopt: (offer) => {
    const { placements, dismissed } = get().map;
    const have = new Set(placements.map((p) => p.id));
    const gone = new Set(dismissed ?? []);
    const fresh = offer.filter((p) => !have.has(p.id) && !gone.has(p.id));
    if (fresh.length) get().commit([...placements, ...fresh]);
    return fresh.length;
  },
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
  remove: (id) => {
    get().commit(get().map.placements.filter((p) => p.id !== id));
    if (isAdopted(id)) set((s) => ({ map: { ...s.map, dismissed: [...(s.map.dismissed ?? []), id] } }));
    if (get().selected === id) set({ selected: null });
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
  clear: () => {
    const adopted = get().map.placements.filter((p) => isAdopted(p.id)).map((p) => p.id);
    get().commit([]);
    if (adopted.length) set((s) => ({ map: { ...s.map, dismissed: [...(s.map.dismissed ?? []), ...adopted] } }));
  },
}));

// Kept in the browser as it changes.
useMap.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s.map));
  } catch {}
});
