// A LAYOUT: a room's furniture moved about by hand — the interiors editor's
// (interiors/, `npm run interiors`) — laid over what the room's own plan put
// there (a Shop Interior's planOf, an Alleyway's alleyPlanOf). The plan
// stays procedural: it furnishes the room as it always has, then the layout
// says what differs:
//
//   move   { id: { x, z, yaw, … } }   those fields written over the item of
//                                     that id (a field that is itself an
//                                     object, a goods display's `g`, has its
//                                     own fields written over, not replaced)
//   drop   [id, …]                    items taken out
//   add    [item, …]                  items put in, each { t, x, z, … } as
//                                     the plan's own items are
//
// An item's id is its kind and its number among the plan's items of that
// kind, in the plan's order: "cafe0", "light2", "hanging0". The plan is the
// same every time by its config, so the ids hold as long as the config does
// (a layout belongs to a shop of one kind, size and style); an added item's
// is "add0", "add1"… by its place in `add`.
//
// The footprints nothing walks through (`blocks`) follow the furniture: a
// block that held an item's foot moves with it, goes with it, and an added
// item gets one of its kind's size (FOOTPRINT), so whoever walks about the
// room (the street's) still walks round the furniture where it stands now.
const isPlain = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && (v.constructor === Object || v.constructor === undefined);

// `patch` written over `it`: one level of an object field merged, the rest replaced
export const patched = (it, patch) => {
  const out = { ...it };
  for (const [k, v] of Object.entries(patch ?? {})) out[k] = isPlain(v) && isPlain(it[k]) ? { ...it[k], ...v } : v;
  return out;
};

// Each item's id, by kind and count (an item that has one keeps it)
export function withIds(items) {
  const n = {};
  return items.map((it) => {
    if (it.id) return it;
    const k = (n[it.t] = (n[it.t] ?? -1) + 1);
    return { ...it, id: `${it.t}${k}` };
  });
}

// How far an added item of each kind reaches from its foot, [along x, along
// z] in the room (turned with its yaw, quarter turns only): its block. `S`
// the room's furniture scale, for the kinds sized in the library's units.
// None for what hangs on a wall or from the ceiling, or walks about.
const FOOTPRINT = {
  cafe: () => [0.85, 0.35],
  table: (it, S) => [((it.w ?? 4) * S) / 2 + 0.08, ((it.l ?? 2.4) * S) / 2 + 0.08],
  counter: (it, S) => [((it.w ?? 6) * S) / 2 + 0.05, 0.3],
  kcounter: (it, S) => [((it.w ?? 4) * S) / 2 + 0.05, 0.3],
  goods: (it) => [((it.g?.x1 ?? 0.6) - (it.g?.x0 ?? -0.6)) / 2, (it.g?.depth ?? 0.28) / 2 + 0.1],
  plant: () => [0.3, 0.3],
  tall: () => [0.24, 0.24],
  chair: () => [0.35, 0.35],
  keeper: () => [0.2, 0.2],
  host: () => [0.2, 0.2],
  lamp: () => [0.15, 0.15],
  fridge: () => [0.4, 0.4],
  cooler: (it) => [(it.len ?? 1) / 2, (it.d ?? 0.55) / 2],
  mirror: () => [0.45, 0.12],
  basin: () => [0.4, 0.25],
  salon: () => [0.33, 0.33],
  elevator: () => [0.65, 0.06],
  mailboxes: () => [0.5, 0.1],
  object: () => [0.3, 0.3], // (the catalog's objects, their size unknown here: a small block)
  bin: (it) => [(it.size ?? 0.5) * 0.6, (it.size ?? 0.5) * 0.6],
  crate: (it) => [(it.size ?? 0.55) * 0.6, (it.size ?? 0.55) * 0.6],
  shelving: (it) => [(it.width ?? 2) / 2, (it.depth ?? 0.45) / 2],
};
export const footprintOf = (it, S = 0.27) => {
  const f = FOOTPRINT[it.t]?.(it, S);
  if (!f) return null;
  const turned = Math.abs(Math.sin(it.yaw ?? 0)) > 0.7;
  const [hx, hz] = turned ? [f[1], f[0]] : f;
  return { x0: it.x - hx, x1: it.x + hx, z0: it.z - hz, z1: it.z + hz };
};

const inBlock = (b, x, z) => x >= b.x0 - 1e-6 && x <= b.x1 + 1e-6 && z >= b.z0 - 1e-6 && z <= b.z1 + 1e-6;

// The plan's `items` and `blocks` with `layout` laid over them (see above).
// `fill(item)`, if given, fills in an added item's missing fields (the
// plan's own colours for a goods display, say) before it goes in. Items
// come back with ids whether or not there is a layout.
export function applyLayout(items, blocks, layout, { fill, S = 0.27 } = {}) {
  items = withIds(items);
  if (emptyLayout(layout)) return { items, blocks };
  const before = new Map(items.map((it) => [it.id, it]));
  const moved = new Map(); // id → the item as it is now
  const dropped = new Set(layout.drop ?? []);
  const out = [];
  for (const it of items) {
    if (dropped.has(it.id)) continue;
    const m = layout.move?.[it.id];
    const now = m ? patched(it, m) : it;
    if (m) moved.set(it.id, now);
    out.push(now);
  }
  const added = (layout.add ?? []).map((a, i) => ({ ...(fill ? fill(a) : a), id: `add${i}` }));
  // the blocks: one that held a moved item's foot goes along with it (the
  // first such item's way, if it held several); one that held only dropped
  // items' feet goes; an added item brings its own
  const kept = [];
  for (const b of blocks) {
    const held = [...before.values()].filter((it) => typeof it.x === "number" && typeof it.z === "number" && inBlock(b, it.x, it.z));
    if (!held.length) { kept.push(b); continue; }
    if (held.every((it) => dropped.has(it.id))) continue;
    const mover = held.find((it) => moved.has(it.id) && !dropped.has(it.id));
    if (!mover) { kept.push(b); continue; }
    const now = moved.get(mover.id), dx = (now.x ?? mover.x) - mover.x, dz = (now.z ?? mover.z) - mover.z;
    kept.push({ x0: b.x0 + dx, x1: b.x1 + dx, z0: b.z0 + dz, z1: b.z1 + dz });
  }
  for (const it of added) {
    const f = footprintOf(it, S);
    if (f) kept.push(f);
  }
  return { items: [...out, ...added], blocks: kept };
}

// A style's layout for a room of this `size`: layouts keyed by size
// ({ 1: {…}, 2: {…} }) give the one for it (or none); a bare layout is for
// every size.
export const layoutFor = (L, size) => {
  if (!L) return null;
  const keys = Object.keys(L);
  if (keys.length && keys.every((k) => /^\d+$/.test(k))) return L[size] ?? null;
  return L;
};

// Is there anything in it?
export const emptyLayout = (L) => !L || (!Object.keys(L.move ?? {}).length && !(L.drop ?? []).length && !(L.add ?? []).length);

// A layout made with the shop's door on one side, for a shop with it on
// the other: the room's plan is laid out the other way round, so the
// layout is too — everything across the middle (x the other way, turns
// the other way); `door` says which side it was made for
const flip = (p) => ({ ...p, ...(p.x != null ? { x: -p.x } : {}), ...(p.yaw != null ? { yaw: -p.yaw } : {}) });
export const mirrorLayout = (L) => ({
  ...L,
  door: L.door === "left" ? "right" : "left",
  ...(L.move ? { move: Object.fromEntries(Object.entries(L.move).map(([id, p]) => [id, flip(p)])) } : {}),
  ...(L.add ? { add: L.add.map(flip) } : {}),
});
