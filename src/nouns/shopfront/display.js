import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { hue } from "../../world/palette.js";
import { CAKE, LOAF } from "../cake/objects.js";
import { cakePartsOf, loafPartsOf } from "../cake/parts.js";

// THE SHOP WINDOW'S INSIDES (see Shopfront.jsx): the wall the windows are
// let into, with their holes cut, and the window display behind them —
// shelves of goods, one merged geometry in vertex colours per shop, so a
// street of shops is a handful of draw calls rather than thousands.

// The outline of one of the library's windows (Opening, interior/
// Opening.jsx) `w` wide and `h` tall with its foot at (cx, foot): its top
// and bottom edges bowed on `top` and `bottom` (1 a half-round), scaled
// back together where they would meet, as Opening does.
export function windowOutline(path, cx, foot, w, h, top = 0, bottom = 0, steps = 16) {
  const r = w / 2;
  const t = Math.max(0, Math.min(1, top)), b = Math.max(0, Math.min(1, bottom));
  const fit = Math.min(1, h / Math.max(1e-6, r * (t + b)));
  const riseT = r * t * fit, riseB = r * b * fit, straight = h - riseT - riseB;
  const low = foot + riseB, high = foot + riseB + straight;
  path.moveTo(cx - r, low);
  if (riseB > 1e-3) for (let i = 1; i <= steps; i++) { const th = Math.PI + (i / steps) * Math.PI; path.lineTo(cx + r * Math.cos(th), low + riseB * Math.sin(th)); }
  else path.lineTo(cx + r, low);
  path.lineTo(cx + r, high);
  if (riseT > 1e-3) for (let i = 1; i <= steps; i++) { const th = (i / steps) * Math.PI; path.lineTo(cx + r * Math.cos(th), high + riseT * Math.sin(th)); }
  else path.lineTo(cx - r, high);
  path.closePath();
  return path;
}

// The wall round the windows: the rectangle x0..x1 by y0..y1, `depth`
// thick back from z = 0, with a hole the shape of each window in `holes`
// ({ cx, foot, w, h, top, bottom }).
export function wallWithHoles(x0, x1, y0, y1, depth, holes) {
  const shape = new THREE.Shape().moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).closePath();
  holes.forEach((o) => shape.holes.push(windowOutline(new THREE.Path(), o.cx, o.foot, o.w, o.h, o.top, o.bottom)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -depth);
  g.computeVertexNormals();
  return g;
}

// A small seeded random.
const rngOf = (seed) => { let s = Math.floor(seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// A part, coloured, placed: kept to be merged.
function part(list, geo, color, at, rot = [0, 0, 0], scale = [1, 1, 1]) {
  geo = geo.index ? geo : geo;
  geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale)));
  const c = hue({ hex: color });
  const n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  if (geo.attributes.uv) geo.deleteAttribute("uv");
  list.push(geo);
}

// The goods each kind of shop puts out, one item at a time along a shelf
// from x: each returns how wide it was. `C` is the shop's goods colours.
const ITEMS = {
  // boxes and tins of all sizes
  boxes: (L, x, y, z, r, C) => {
    const w = 0.12 + r() * 0.1, h = 0.1 + r() * 0.2;
    if (r() < 0.35) part(L, new THREE.CylinderGeometry(w * 0.4, w * 0.4, h, 14), C[Math.floor(r() * C.length)], [x + w / 2, y + h / 2, z]);
    else part(L, new THREE.BoxGeometry(w, h, 0.14), C[Math.floor(r() * C.length)], [x + w / 2, y + h / 2, z], [0, (r() - 0.5) * 0.3, 0]);
    return w;
  },
  // iced cakes with a cherry, and round loaves: the library's own (Food/
  // Baked/Cake and Loaf), the sponge and icing in the shop's colours
  cakes: (L, x, y, z, r, C) => {
    if (r() < 0.35) {
      const turn = r();
      loafPartsOf(LOAF).forEach((p) => part(L, p.geo, p.color, [x + 0.11 + p.at[0], y + p.at[1], z + p.at[2]], [0, turn, 0], p.scale));
      return 0.24;
    }
    const rr = 0.09 + r() * 0.03, h = 0.08 + r() * 0.04;
    const icing = C[1 + Math.floor(r() * (C.length - 1))];
    cakePartsOf({ ...CAKE, radius: rr, height: h, color: C[0], icing: { ...CAKE.icing, color: icing } })
      .forEach((p) => part(L, p.geo, p.color, [x + rr + p.at[0], y + p.at[1], z + p.at[2]], [0, 0, 0], p.scale));
    return rr * 2;
  },
  // potted flowers: a pot, a stem, a few blooms
  flowers: (L, x, y, z, r, C) => {
    part(L, new THREE.CylinderGeometry(0.06, 0.045, 0.1, 14), "#C8744B", [x + 0.06, y + 0.05, z]);
    part(L, new THREE.CylinderGeometry(0.006, 0.006, 0.14, 5), "#4F7A4A", [x + 0.06, y + 0.17, z]);
    const c = C[Math.floor(r() * C.length)];
    for (let k = 0; k < 4; k++) {
      const th = (k / 4) * Math.PI * 2 + r();
      part(L, new THREE.SphereGeometry(0.035, 10, 8), c, [x + 0.06 + Math.cos(th) * 0.04, y + 0.25 + r() * 0.03, z + Math.sin(th) * 0.04]);
    }
    part(L, new THREE.SphereGeometry(0.022, 8, 6), "#F2C94C", [x + 0.06, y + 0.27, z]);
    return 0.14;
  },
  // bottles and cans of drink, for a cooler: a bottle's body, its
  // shoulder, its neck and a dark cap; a can now and then
  bottles: (L, x, y, z, r, C) => {
    const c = C[Math.floor(r() * C.length)];
    if (r() < 0.35) {
      part(L, new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12), c, [x + 0.04, y + 0.06, z]);
      part(L, new THREE.CylinderGeometry(0.03, 0.03, 0.006, 12), "#C9CED6", [x + 0.04, y + 0.123, z]);
      return 0.085;
    }
    const h = 0.17 + r() * 0.08, rr = 0.033 + r() * 0.012, cx = x + rr + 0.006;
    part(L, new THREE.CylinderGeometry(rr, rr, h * 0.62, 12), c, [cx, y + h * 0.31, z]);
    part(L, new THREE.CylinderGeometry(rr * 0.4, rr, h * 0.18, 12), c, [cx, y + h * 0.71, z]);
    part(L, new THREE.CylinderGeometry(rr * 0.4, rr * 0.4, h * 0.14, 10), c, [cx, y + h * 0.87, z]);
    part(L, new THREE.CylinderGeometry(rr * 0.48, rr * 0.48, 0.022, 10), "#2F2A36", [cx, y + h * 0.95, z]);
    return rr * 2 + 0.012;
  },
  // books stood up along the shelf, now and then one leaning
  books: (L, x, y, z, r, C) => {
    const w = 0.03 + r() * 0.035, h = 0.17 + r() * 0.12, lean = r() < 0.12 ? 0.25 : 0;
    part(L, new THREE.BoxGeometry(w, h, 0.15), C[Math.floor(r() * C.length)], [x + w / 2 + (lean ? h * 0.12 : 0), y + h / 2 - (lean ? 0.01 : 0), z], [0, 0, -lean]);
    return w + (lean ? h * 0.25 : 0.004);
  },
};
export const GOODS_STYLES = Object.keys(ITEMS);

// The display: `shelves` (heights) of boards x0..x1, `depth` deep, their
// fronts at z, with uprights at the ends, and goods of `style` in `colors`
// along each (none, for `style` "none"). `legs` false cuts the uprights off
// under the lowest board, for shelving put up on a wall. One geometry in
// vertex colours.
export function displayOf({ x0, x1, z, depth, shelves, style, colors, wood, seed, legs = true }) {
  const L = [], r = rngOf(seed);
  const mid = z - depth / 2;
  shelves.forEach((y) => part(L, new THREE.BoxGeometry(x1 - x0, 0.03, depth), wood, [(x0 + x1) / 2, y - 0.015, mid]));
  const lo = legs ? 0 : Math.max(0, Math.min(...shelves) - 0.08), hi = Math.max(...shelves) + 0.04;
  [x0 + 0.02, x1 - 0.02].forEach((x) => part(L, new THREE.BoxGeometry(0.04, hi - lo, depth), wood, [x, (lo + hi) / 2, mid]));
  const make = ITEMS[style] ?? ITEMS.boxes;
  // style "none": the bare boards, for whoever sets things of their own on them
  if (style !== "none") shelves.forEach((y) => {
    let x = x0 + 0.08;
    while (true) {
      const before = L.length;
      const w = make(L, x, y, mid + (r() - 0.5) * depth * 0.3, r, colors);
      if (x + w > x1 - 0.08) { L.splice(before).forEach((g) => g.dispose()); break; }
      x += w + 0.03 + r() * 0.05;
    }
  });
  const out = mergeGeometries(L, false);
  L.forEach((g) => g.dispose());
  return out;
}
