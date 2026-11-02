// THE LAYOUT being made, and what the editor is doing to it.
//
// What is in hand: the `room` (one of shops.js's ROOMS: a shop kind, or
// the alleyway), its knob `args` (the story's: size, door side, seed, a
// café's style…) and the `layout` laid over its furniture — `move` by item
// id, `drop`, `add` (src/world/furnish.js). The room's config is the args
// through the room's configOf; the plan (its items, the room's measures) is
// that config with the layout over it, worked out again whenever either
// changes (cheap: no geometry in it).
//
// Every change to the layout goes through `commit`, which keeps the one
// before for undo; a drag goes through patchLive between beginLive and
// endLive, one undo step for the whole of it. What is in hand is kept in
// localStorage, so a reload (every change to the code is one) comes back to it.
import { create } from "zustand";
import { ROOMS, ROOM, boundsOf, WALL_IN } from "./shops.js";
import { patched, emptyLayout } from "../src/world/furnish.js";
import { CAFE_STYLES, FLORIST_STYLES } from "../src/nouns/shopInterior/objects.js";

const KEY = "interiors-editor";
export const blankLayout = () => ({ move: {}, drop: [], add: [] });
const round = (v, step = 0.01) => +(Math.round(v / step) * step).toFixed(4);

const kept = (() => {
  try {
    const k = JSON.parse(localStorage.getItem(KEY));
    return k && ROOM[k.roomId] ? k : null;
  } catch {
    return null;
  }
})();
const first = ROOMS[0];

// A layout with nothing in it left out: what is copied out
export const trimmed = (L) => {
  const out = {};
  if (Object.keys(L.move ?? {}).length) out.move = L.move;
  if ((L.drop ?? []).length) out.drop = L.drop;
  if ((L.add ?? []).length) out.add = L.add;
  return Object.keys(out).length ? out : null;
};
// …and one pasted in, filled out (`door`, if it says which side it was made for, kept)
export const filled = (L) => ({ ...(L?.door ? { door: L.door } : {}), move: { ...(L?.move ?? {}) }, drop: [...(L?.drop ?? [])], add: [...(L?.add ?? [])] });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// THE BASE: the layout the storybook already has for the room as the knobs
// set it (a café style's, a kind's own), which the editor starts from and
// carries on — so what is loaded is what the storybook shows
const baseOf = (roomId, args) => {
  const room = ROOM[roomId];
  return filled(room.baseLayoutOf(room.configOf(args)));
};
// WHICH LAYOUT: a room of each size, door side and style (a café's, a
// florist's; an alley's back room's kind) has a layout of its own — the
// plan lays each out afresh, so a tiny shop's layout is not a standard
// one's — kept apart in `stash` by this key and swapped in as the knobs
// turn, so sizes never tread on one another
export const keyOf = (roomId, args) => (ROOM[roomId]?.alley ? `${roomId}|${args.roomKind ?? ""}` : `${roomId}|${args.size}|${args.doorSide}|${args.cafeStyle ?? args.floristStyle ?? ""}`);

// A layout worth keeping in the stash: one changed from what the storybook
// has for that room (the rest come out of the storybook afresh each time,
// so a layout baked in since shows)
const edited = (roomId, args, L) => !same(L, baseOf(roomId, args));

// STALE ONES, from before a layout was baked or moved: kept layouts that
// are empty, or the very layout the storybook has for the same room with
// another style (a style's layout since given to another), aren't anyone's
// work — dropped, so the storybook's own shows. (Run once, on loading.)
const styleArgs = (roomId, args) => {
  const R = ROOM[roomId];
  if (!R || R.alley) return [];
  const which = "cafeStyle" in args ? ["cafeStyle", Object.keys(CAFE_STYLES)] : "floristStyle" in args ? ["floristStyle", Object.keys(FLORIST_STYLES)] : null;
  return which ? which[1].map((v) => ({ ...args, [which[0]]: v })) : [args];
};
const stale = (roomId, args, L) => emptyLayout(L) || styleArgs(roomId, args).some((a) => same(L, baseOf(roomId, a)));
const argsOfKey = (key, stash) => {
  const [roomId, size, doorSide, style] = key.split("|");
  const R = ROOM[roomId];
  if (!R || R.alley) return null;
  const base = { ...R.args, ...(stash[`args:${roomId}`] ?? {}), size: +size, doorSide };
  if ("cafeStyle" in base) base.cafeStyle = style; else if ("floristStyle" in base) base.floristStyle = style;
  return { roomId, args: base };
};
const cleaned = (stash) => {
  const out = {};
  for (const [k, v] of Object.entries(stash ?? {})) {
    if (k.startsWith("args:")) { out[k] = v; continue; }
    const at = argsOfKey(k, stash ?? {});
    try { if (at && (stale(at.roomId, at.args, v) || !edited(at.roomId, at.args, v))) continue; } catch {}
    out[k] = v;
  }
  return out;
};
const keptLayout = (() => {
  if (!kept?.layout) return null;
  try { return stale(kept.roomId, kept.args, kept.layout) ? null : filled(kept.layout); } catch { return null; }
})();

export const useEditor = create((set, get) => ({
  roomId: kept?.roomId ?? first.id,
  args: kept?.args ?? { ...first.args },
  layout: keptLayout ?? baseOf(kept?.roomId ?? first.id, kept?.args ?? first.args),
  stash: cleaned(kept?.stash), // the other rooms' and sizes' layouts you've changed, by keyOf
  grid: kept?.grid ?? true,
  undo: [],
  redo: [],
  selected: null, // an item's id
  placing: null, // a palette entry (shops.js), while placing one
  hover: null, // [x, z] under the pointer on the floor, while placing
  status: "",
  liveBefore: null,
  focus: null, // set by the scene: () brings the camera back to the room

  room: () => ROOM[get().roomId],
  config: () => get().room().configOf(get().args),
  plan: () => get().room().planOf(get().config(), get().layout),
  bounds: () => boundsOf(get().plan(), get().room()),
  item: (id) => get().plan().items.find((it) => it.id === id),

  // The layout in hand put by in the stash, and the one for `roomId` as
  // `args` set it brought out (the storybook's own, the first time)
  swapTo: (roomId, args) =>
    set((s) => {
      // (put by only if it's been changed: else the storybook's own next time)
      const here = keyOf(s.roomId, s.args), stash = { ...s.stash, [`args:${s.roomId}`]: s.args };
      if (edited(s.roomId, s.args, s.layout)) stash[here] = s.layout; else delete stash[here];
      const key = keyOf(roomId, args);
      const layout = stash[key] ?? baseOf(roomId, args);
      const swapped = key !== keyOf(s.roomId, s.args);
      return { roomId, args, stash, layout, ...(swapped ? { undo: [], redo: [], selected: null, placing: null, hover: null, status: "" } : {}) };
    }),
  // ANOTHER ROOM: its own knobs start over (where they were last left); its own layout
  setRoom: (roomId) => {
    if (!ROOM[roomId] || roomId === get().roomId) return;
    get().swapTo(roomId, { ...ROOM[roomId].args, ...(get().stash[`args:${roomId}`] ?? {}) });
  },
  // A knob turned. Another size, door side or style is another room with
  // a layout of its own (keyOf); the rest (a seed, a colour) keep the
  // layout — moving a plan item by id still holds while the plan has an
  // item of that id (a new seed may not)
  setArg: (name, v) => get().swapTo(get().roomId, { ...get().args, [name]: v }),
  setArgs: (args) => get().swapTo(get().roomId, args),
  setGrid: (grid) => set({ grid }),
  say: (status) => set({ status }),
  select: (selected) => set({ selected, placing: null, hover: null }),
  startPlacing: (placing) => set({ placing, selected: null }),
  stopPlacing: () => set({ placing: null, hover: null }),
  setHover: (hover) => set({ hover }),

  // The layout replaced, the one before kept for undo
  commit: (layout) => set((s) => ({ layout, undo: [...s.undo.slice(-99), s.layout], redo: [] })),
  beginLive: () => set((s) => (s.liveBefore ? s : { liveBefore: s.layout })),
  endLive: () =>
    set((s) => {
      if (!s.liveBefore) return s;
      const changed = s.liveBefore !== s.layout;
      return { liveBefore: null, ...(changed ? { undo: [...s.undo.slice(-99), s.liveBefore], redo: [] } : {}) };
    }),
  undoStep: () =>
    set((s) => {
      if (!s.undo.length) return s;
      const prev = s.undo[s.undo.length - 1];
      return { layout: prev, undo: s.undo.slice(0, -1), redo: [...s.redo, s.layout] };
    }),
  redoStep: () =>
    set((s) => {
      if (!s.redo.length) return s;
      const next = s.redo[s.redo.length - 1];
      return { layout: next, redo: s.redo.slice(0, -1), undo: [...s.undo, s.layout] };
    }),

  // AN ITEM CHANGED: `patch` written over it — into `add` for one the
  // layout put in ("add3"), into `move` for one of the plan's. Live, or as
  // an undo step of its own.
  withItem: (layout, id, patch) => {
    const m = /^add(\d+)$/.exec(id);
    if (m) {
      const i = +m[1];
      if (!layout.add[i]) return layout;
      return { ...layout, add: layout.add.map((a, k) => (k === i ? patched(a, patch) : a)) };
    }
    return { ...layout, move: { ...layout.move, [id]: patched(layout.move[id] ?? {}, patch) } };
  },
  patchLive: (id, patch) => set((s) => ({ layout: get().withItem(s.layout, id, patch) })),
  patch: (id, patch) => get().commit(get().withItem(get().layout, id, patch)),
  // the item's place and turn as the plan has it now, over the pointer's (a drag)
  moveLive: (id, x, z, snap) => {
    const B = get().bounds(), step = snap ? 0.1 : 0.01;
    get().patchLive(id, { x: round(Math.min(B.x1, Math.max(B.x0, x)), step), z: round(Math.min(B.z1, Math.max(B.z0, z)), step) });
  },
  // taken out: a plan item is dropped; an added one is taken off `add` (the ones after it move up a number)
  remove: (id) => {
    const L = get().layout, m = /^add(\d+)$/.exec(id);
    if (m) get().commit({ ...L, add: L.add.filter((_, k) => k !== +m[1]) });
    else if (!L.drop.includes(id)) {
      const { [id]: _gone, ...move } = L.move; // eslint-disable-line no-unused-vars
      get().commit({ ...L, move, drop: [...L.drop, id] });
    }
    if (get().selected === id) set({ selected: null });
  },
  // a plan item's own place again (its move forgotten)
  reset: (id) => {
    const L = get().layout;
    if (!L.move[id]) return;
    const { [id]: _gone, ...move } = L.move; // eslint-disable-line no-unused-vars
    get().commit({ ...L, move });
  },
  // a dropped plan item back where it was
  restore: (id) => {
    const L = get().layout;
    if (!L.drop.includes(id)) return;
    get().commit({ ...L, drop: L.drop.filter((d) => d !== id) });
    set({ selected: id });
  },
  // one more of this kind: the item as it stands, a step over, added
  add: (fields, x, z) => {
    const L = get().layout;
    const { id: _id, ...rest } = fields; // eslint-disable-line no-unused-vars
    const B = get().bounds(); // (set down within the room, wherever the click fell)
    const it = { ...rest, x: round(Math.min(B.x1, Math.max(B.x0, x))), z: round(Math.min(B.z1, Math.max(B.z0, z))) };
    get().commit({ ...L, add: [...L.add, it] });
    const id = `add${L.add.length}`;
    set({ selected: id });
    return id;
  },
  duplicate: (id) => {
    const it = get().item(id);
    if (!it) return;
    // (an item the plan placed by its goods' own offsets keeps them: only its x and z change)
    return get().add(it, it.x + 0.4, it.z);
  },
  // AGAINST THE NEAREST WALL: a wall-hung thing (shops.js's WALL_IN) put
  // to the left, right or back wall's face, whichever is nearest, turned to
  // face into the room
  snapToWall: (id) => {
    const it = get().item(id);
    if (!it) return;
    const B = get().bounds(), inset = WALL_IN[it.t] ?? 0;
    const d = { left: Math.abs(it.x - B.wall.left), right: Math.abs(B.wall.right - it.x), back: Math.abs(it.z - B.wall.back) };
    const near = Object.keys(d).sort((a, b) => d[a] - d[b])[0];
    if (near === "left") get().patch(id, { x: round(B.wall.left + inset), yaw: round(Math.PI / 2, 0.0001) });
    else if (near === "right") get().patch(id, { x: round(B.wall.right - inset), yaw: round(-Math.PI / 2, 0.0001) });
    else get().patch(id, { z: round(B.wall.back + inset), yaw: 0 });
  },
  setLayout: (layout) => get().commit(filled(layout)),
  // the storybook's own again (its baked layout, or the bare plan)
  clear: () => get().commit(baseOf(get().roomId, get().args)),
  // the bare plan, nothing over it
  bare: () => get().commit(blankLayout()),
  untouched: () => same(get().layout, baseOf(get().roomId, get().args)),
}));

// Kept in the browser as it changes
useEditor.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ roomId: s.roomId, args: s.args, layout: s.layout, grid: s.grid, stash: s.stash }));
  } catch {}
});

// What the layout has done, in a few words (the status line)
export const summaryOf = (L, untouched = false) => {
  if (untouched) return emptyLayout(L) ? "the plan as it is" : "as the storybook has it";
  if (emptyLayout(L)) return "the bare plan";
  const n = Object.keys(L.move ?? {}).length, d = (L.drop ?? []).length, a = (L.add ?? []).length;
  return [n && `${n} moved`, d && `${d} taken out`, a && `${a} added`].filter(Boolean).join(" · ");
};
