/* ============================================================
   the skyscraper from the Car project (Desktop/car/planet.js, "the
   buildings"), built in the dollies' house style: cream walls stacked up
   `floors` stories of the house's windows, a plum cornice between each, a
   narrower tier set back on top, a violet slab over each tier, a plum
   spire, and the house's door and two windows at the foot. Built +y up
   with its front facing +z, its foot at y = 0, every part merged into one
   mesh per color; the window panes are lit (their own color at any
   hour, shaded by nothing), the way the game lights them.

   `toon(color)` makes the lit materials (a palette color in, a material
   out); `hue(color)` turns one into a THREE.Color for the panes.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { solid } from "../world/palette.js";

export const HOUSE_COLORS = {
  walls: solid("#F5EBDD"),
  roof: solid("#7c56be"), // violet
  ridge: solid("#3B2A4E"), // plum
  frame: solid("#FFFFFF"),
  pane: solid("#FFF6DC"),
  door: solid("#E5534B"),
  knob: solid("#FFD092"),
};
// The house's windows and door (the dollies' House.jsx), which the tower borrows
const HOUSE = {
  windows: { width: 1.3, height: 1.3, depth: 0.12, y: 2.5, apart: 1.9, frame: { thickness: 0.18, depth: 0.2 } },
  door: { width: 1.4, height: 2.4, depth: 0.16, knob: { radius: 0.11, side: 0.6 } },
};
export const SKYSCRAPER = {
  width: 7,
  depth: 7,
  storey: 3, // one floor's height
  floors: [6, 10], // how many in the main tier, rolled per tower in the game
  sink: 0.1,
  cornice: { height: 0.18, proud: 0.08 }, // between floors, and the plinth at the foot
  tier: { share: 0.62, floors: 3 }, // the tier set back on top: its width as a share of the main one's, and its floors
  slab: { thickness: 0.5, eaves: 0.4 }, // the violet slab over each tier
  spire: { radius: 0.22, height: 3.2, ball: 0.38 },
  windows: { ...HOUSE.windows, perFace: 3 }, // across each face, every floor
};

export function buildSkyscraper({ toon, hue }, floors = 8, S = SKYSCRAPER, K = HOUSE_COLORS) {
  // Every part goes into a pile for its color, under the building's matrix
  const parts = {};
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
  const part = (color, size, position, rotation = [0, 0, 0], M) => {
    const g = new THREE.BoxGeometry(...size);
    g.deleteAttribute("uv");
    _q.setFromEuler(new THREE.Euler(...rotation));
    _p.set(...position);
    g.applyMatrix4(_m.compose(_p, _q, _s)).applyMatrix4(M);
    (parts[color.hex] ??= { color, list: [] }).list.push(g);
  };
  const geo = (color, g, M) => {
    g.deleteAttribute("uv");
    (parts[color.hex] ??= { color, list: [] }).list.push(g.applyMatrix4(M));
  };
  const plaque = (color, x, y, width, height, depth, face, M) => part(color, [width, height, depth], [x, y, face + depth / 2], undefined, M);
  const windowAt = (W, x, face, M) => {
    const F = W.frame, t = F.thickness;
    plaque(K.pane, x, W.y, W.width, W.height, W.depth, face, M);
    for (const b of [
      { x: 0, y: W.height / 2 + t / 2, w: W.width + 2 * t, h: t },
      { x: 0, y: -(W.height / 2 + t / 2), w: W.width + 2 * t, h: t },
      { x: W.width / 2 + t / 2, y: 0, w: t, h: W.height },
      { x: -(W.width / 2 + t / 2), y: 0, w: t, h: W.height },
    ])
      plaque(K.frame, x + b.x, W.y + b.y, b.w, b.h, F.depth, face, M);
  };
  const doorAt = (D, face, M) => {
    plaque(K.door, 0, D.height / 2, D.width, D.height, D.depth, face, M);
    const Kn = D.knob;
    geo(K.knob, new THREE.SphereGeometry(Kn.radius, 10, 7).translate((Kn.side * D.width) / 2, D.height / 2, face + D.depth + Kn.radius * 0.6), M);
  };
  const M = new THREE.Matrix4();
  const W = S.windows;
  const tier = (width, depth, floors, base, perFace) => {
    const height = floors * S.storey;
    part(K.walls, [width, height + S.sink, depth], [0, base + height / 2 - S.sink / 2, 0], undefined, M);
    // Windows on each face: the face turned to +z, then the row.
    for (const [yaw, face] of [[0, depth / 2], [Math.PI, depth / 2], [Math.PI / 2, width / 2], [-Math.PI / 2, width / 2]]) {
      const across = yaw === 0 || yaw === Math.PI ? width : depth;
      const faceM = new THREE.Matrix4().makeRotationY(yaw).premultiply(M);
      const pitch = across / (perFace + 0.4);
      for (let f = 0; f < floors; f++) {
        if (f === 0 && yaw === 0 && base === 0) continue; // the ground floor's front is the house's: door and two windows
        const Wf = { ...W, y: base + f * S.storey + W.y };
        for (let i = 0; i < perFace; i++) windowAt(Wf, (i - (perFace - 1) / 2) * pitch, face, faceM);
      }
    }
    // The cornices, one over each floor but the last, and the plinth.
    const C = S.cornice;
    for (let f = 1; f < floors; f++) part(K.ridge, [width + 2 * C.proud, C.height, depth + 2 * C.proud], [0, base + f * S.storey, 0], undefined, M);
    if (base === 0) part(K.ridge, [width + 2 * C.proud, C.height * 2, depth + 2 * C.proud], [0, C.height, 0], undefined, M);
    // The slab over it.
    const top = base + height;
    part(K.roof, [width + 2 * S.slab.eaves, S.slab.thickness, depth + 2 * S.slab.eaves], [0, top + S.slab.thickness / 2, 0], undefined, M);
    return top + S.slab.thickness;
  };
  const top1 = tier(S.width, S.depth, floors, 0, W.perFace);
  const top2 = tier(S.width * S.tier.share, S.depth * S.tier.share, S.tier.floors, top1, Math.max(1, W.perFace - 1));
  // The foot: the house's front.
  const face = S.depth / 2;
  doorAt(HOUSE.door, face, M);
  for (const side of [-1, 1]) windowAt(W, side * HOUSE.windows.apart, face, M);
  // The spire.
  const P = S.spire;
  geo(K.ridge, new THREE.CylinderGeometry(P.radius * 0.6, P.radius, P.height, 8).translate(0, top2 + P.height / 2, 0), M);
  geo(K.roof, new THREE.SphereGeometry(P.ball, 10, 7).translate(0, top2 + P.height + P.ball * 0.6, 0), M);

  const group = new THREE.Group();
  for (const { color, list } of Object.values(parts)) {
    const merged = mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
    const lit = color === K.pane;
    const mesh = new THREE.Mesh(merged, lit ? new THREE.MeshBasicMaterial({ color: hue(color) }) : toon(color));
    mesh.castShadow = !lit;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
