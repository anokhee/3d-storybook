import { solid } from "../../world/palette.js";
import { applyLayout } from "../../world/furnish.js";

// AN ALLEYWAY between two shops (see SHOPFRONT): its mouth on the street at
// z = 0, running back along -z, centred on x = 0, its ground at y = 0.
//
//   width, deep   across, and how far back it runs (as deep as the shops)
//   gutter        the darker channel down its middle, this wide
//   wall          closing its far end: `height` tall, `thick`, brick with
//                 mortar lines every `course`; a `gate` in it — a doorway
//                 cut through, a Metal Door hung in it (Fixtures/Doors/Metal
//                 Door: `door` its size, head and steel), swung as `swing`
//                 says (see Alley) — and a `lamp` glowing over that
//   room          what the door opens on, `on` or not: a room `width` by
//                 `deep`, `height` tall, behind the end wall (which runs its
//                 width and height), of a `kind` — "storage", shelving of
//                 boxes down both walls and crates stacked in the back
//                 corners; "interrogation", one wall of shelving, crates in
//                 a corner, one chair in the middle facing the door under a
//                 bare bulb and a stopped clock on the back wall; or "any",
//                 one of them by its `seed` (the interrogation room about
//                 one time in `odd`) — the same each time by its `seed`
//   bins          wheelie bins against its sides: `count`, each `size`
//                 across (less in a narrow alley), in `colors`; `seed` where
//   sides         walls up each side, `height` tall — for an alley on its
//                 own; off between shops, whose own walls are its sides
//   colors        the paving, gutter, brick, mortar, gate, sides, lamp
//   layout        the bins, shelving, crates and the rest moved about by
//                 hand, over where the plan puts them (world/furnish.js:
//                 `move` by item id, `drop`, `add`) — made in the interiors
//                 editor (`npm run interiors`); null, the plan as it is
export const ALLEY = {
  width: 1.3,
  deep: 5,
  gutter: 0.18,
  wall: { height: 2.2, thick: 0.16, course: 0.55, gate: true, lamp: true },
  bins: { count: 1, size: 0.5, colors: [solid("#3F6B4F"), solid("#3B4A6B"), solid("#2F2A36")], seed: 1 },
  sides: { on: false, height: 2.4 },
  door: { width: 0.85, height: 1.95, curve: 0, steel: solid("#7E858C") },
  room: { on: false, kind: "any", odd: 5, width: 5, deep: 4.2, height: 2.8, seed: 1, floor: solid("#8C8A86"), walls: solid("#6F6A73"), crate: solid("#A0784F"), glow: { intensity: 6, distance: 7 } },
  colors: {
    paving: solid("#7A727F"),
    gutter: solid("#5B5566"),
    brick: solid("#8A5444"),
    mortar: solid("#6E4236"),
    gate: solid("#6B4A33"),
    side: solid("#C9BFB2"),
    lamp: solid("#FFE7A3"),
  },
  layout: null,
};

export const ALLEY_KNOBS = {
  width: { path: "width", range: [0.6, 3, 0.05] },
  deep: { path: "deep", range: [1, 10, 0.1], name: "depth" },
  bins: { path: "bins.count", range: [0, 4, 1] },
  gate: { path: "wall.gate", bool: true },
  lamp: { path: "wall.lamp", bool: true },
  sides: { path: "sides.on", bool: true, name: "side walls" },
  room: { path: "room.on", bool: true, name: "back room" },
  roomKind: { path: "room.kind", options: ["any", "storage", "interrogation"], name: "back room kind" },
  brick: { path: "colors.brick.hex", color: true, name: "brick color" },
  paving: { path: "colors.paving.hex", color: true, name: "paving color" },
};

// WHERE THINGS ARE IN AN ALLEY, from its config (laid over ALLEY): its
// `items`, each { t, id, x, z, yaw, … } (as a Shop Interior's are, with an
// id each: world/furnish.js) — the bins ("bin": `size` across, `color`),
// and in the warehouse its shelving ("shelving": `width`, `depth`, `seed`),
// the stacked crates ("crate": `n` high, `size`), the chair, the bulb
// ("bulb": `y` the ceiling, `cord`) and the clock — the `binW` across, and,
// for whoever walks about it (the street's, gone into as a shop is), the
// `room` — half its width inside the walls `iw`, the far wall's face `zb`,
// its mouth (the whole of its width: `doorX`, `doorW`), how deep `D` — and
// the `blocks` nothing walks through (the bins, the crates). Pure, so the
// walker works out the same. `layout`, if given (else the config's own),
// is laid over the items last (furnish.js). `warehouse` is the room's
// own measures (`W`, `D`, `H`, `z0`, `zb`, its `kind`), or null.
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
export function alleyPlanOf(A, layout = A.layout) {
  const plan = alleyFurnishOf(A);
  const laid = applyLayout(plan.items, plan.blocks, layout, { S: 0.27, fill: (a) => ({ yaw: 0, ...(a.t === "bin" ? { size: plan.binW, color: A.bins.colors[0] } : a.t === "crate" ? { n: 2, size: 0.55 } : a.t === "shelving" ? { width: 2, depth: 0.45, seed: 1 } : a.t === "bulb" ? { y: A.room.height, cord: 0.5 } : a.t === "clock" ? { y: 2.0 } : {}), ...a }) });
  return { ...plan, items: laid.items, blocks: laid.blocks };
}
function alleyFurnishOf(A) {
  const w = A.width, deep = A.deep, t = A.wall.thick;
  const binW = Math.min(A.bins.size, w * 0.42);
  const q = rng(900 + Math.round(A.bins.seed * 11) + 1);
  const items = Array.from({ length: Math.max(0, Math.round(A.bins.count)) }, (_, i) => {
    const back = 1.2 + i * 0.75 + q() * 0.5, side = q() < 0.5 ? -1 : 1, color = A.bins.colors[Math.floor(q() * A.bins.colors.length)], turn = (q() - 0.5) * 0.4;
    return { t: "bin", x: side * (w / 2 - binW / 2 - 0.05), z: -Math.min(deep - 0.6, back), yaw: turn, size: binW, color };
  });
  const r = binW * 0.6; // a bin's reach, turned a little
  const blocks = items.map((b) => ({ x0: b.x - r, x1: b.x + r, z0: b.z - r, z1: b.z + r }));
  const dw = Math.min(A.door.width, w - 0.2), dh = A.door.height;
  const room = { W: w, D: deep, iw: w / 2, zb: -deep + t, doorX: 0, doorW: w, door: { width: dw, height: dh } };
  const out = { items, binW, room, blocks, warehouse: null };
  const Rm = A.room;
  if (!Rm.on || !A.wall.gate) return out;
  // THE WAREHOUSE behind the end wall, through the door: `kitchen` as a
  // café's is (the walker's way through a back wall: see crowd's Inside)
  const RW = Math.max(w, Rm.width), RD = Rm.deep, z0 = -deep, zb = -deep - RD, q2 = rng(4000 + Math.round(Rm.seed * 13));
  room.iw = RW / 2;
  room.kitchen = { zb, doorX: 0, doorW: dw, W: RW, KD: RD };
  const block = (x0, x1, za, zc) => blocks.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(za, zc), z1: Math.max(za, zc) });
  // the alley's own walls, the warehouse being wider; the end wall either side of the door
  [-1, 1].forEach((e) => { block(e * w / 2, e * (RW / 2 + 1), z0, 1.2); block(e * dw / 2, e * (RW / 2 + 1), z0, z0 + t); });
  // which kind: the interrogation room now and then, storage mostly
  q2(); q2(); q2(); // its first few are small for a small seed: let it get going
  const kind = Rm.kind === "storage" || Rm.kind === "interrogation" ? Rm.kind : q2() < 1 / Math.max(1, Rm.odd) ? "interrogation" : "storage";
  const odd = kind === "interrogation";
  // shelving of boxes down the left wall (and the right, in a store room)
  const shelfD = 0.45, shelfL = RD - 1.2;
  (odd ? [-1] : [-1, 1]).forEach((e) => {
    // the right's stops short of the crates in the corner
    const len = e > 0 ? shelfL - 1.4 : shelfL;
    if (len < 0.8) return;
    items.push({ t: "shelving", x: e * (RW / 2 - shelfD), z: z0 - 0.6 - len / 2, width: len, depth: shelfD, yaw: -e * Math.PI / 2, seed: Math.floor(q2() * 50) });
    block(e * RW / 2, e * (RW / 2 - shelfD - 0.05), z0 - 0.6, z0 - 0.6 - len);
  });
  // crates stacked in the back corner (both, in a store room), one to three high, turned a little
  const c = 0.55;
  (odd ? [1] : [1, -1]).forEach((e) => {
    [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1]].forEach(([i, j], k) => {
      if (k > 2 && q2() < 0.35) return;
      const x = e * (RW / 2 - 0.4 - i * (c + 0.08)), z = zb + 0.4 + j * (c + 0.08);
      items.push({ t: "crate", x, z, n: 1 + Math.floor(q2() * 3), yaw: (q2() - 0.5) * 0.3, size: c });
      block(x - c * 0.6, x + c * 0.6, z - c * 0.6, z + c * 0.6);
    });
  });
  // the interrogation room's one chair in the middle under the bulb, facing the door
  const chair = odd ? { x: (q2() - 0.5) * 0.4, z: z0 - RD * 0.55 } : null;
  if (chair) { items.push({ t: "chair", x: chair.x, z: chair.z, yaw: 0 }); block(chair.x - 0.25, chair.x + 0.25, chair.z - 0.25, chair.z + 0.25); }
  // the bulb: over the chair, hung low; or up near the ceiling in the middle of a store room, dimmer (`dim`)
  items.push(chair ? { t: "bulb", x: chair.x, z: chair.z + 0.15, yaw: 0, y: Rm.height, cord: 0.7 } : { t: "bulb", x: 0, z: z0 - RD * 0.45, yaw: 0, y: Rm.height, cord: 0.35, dim: true });
  if (odd) items.push({ t: "clock", x: -RW * 0.15, z: zb + 0.01, yaw: 0, y: 2.0 });
  out.warehouse = { kind, W: RW, D: RD, H: Rm.height, z0, zb };
  return out;
}
