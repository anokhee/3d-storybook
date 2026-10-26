/* ============================================================
   TRAY: the cockpit the cut-out cars share (bugcar.js, fishcar.js,
   bananacar.js, hotdogcar.js). The body is cut through like a cookie
   cutter by a rectangle seen from above, the WELL: every triangle is
   trimmed against it and the part over it thrown away, all but what
   lies under the cockpit's floor. Round the well the body is eased to
   one LEVEL, so the cut's edge runs in four straight, level lines. In
   the well: a floor, four walls up to the rim, a solid lip round it,
   the roadster's dashboard, steering wheel and two bucket seats, and
   an arched windshield raked back from the front edge. Every car's
   cockpit is the same size, so a driver fits each the same way. Up is
   +Y, the car faces +X.
   ============================================================ */
import * as THREE from "three";
import { seatHeadrest } from "./seat.js";

// The cockpit, the same on every car: `len` along the car, `half`
// either side of its middle, `depth` from the floor up to the rim.
export const COCKPIT = { len: 1.15, half: 0.62, depth: 0.62 };

// One side of a plane through a polygon (Sutherland-Hodgman): the part
// of `poly` (vertices { p, n }) where coordinate `k` ("x", "y" or "z")
// is on the `keep` side (+1 above, -1 below) of `v`, the new vertices
// made along the edges it cuts.
function clipSide(poly, k, v, keep) {
  const out = [], inside = (a) => keep * (a.p[k] - v) >= 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) {
      const t = (v - a.p[k]) / (b.p[k] - a.p[k]);
      out.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() });
    }
  }
  return out;
}

// Easing a body to one level round a `well` ({ x0, x1, z1 }): within
// `margin` of the well the surface is drawn to `level`, all the way at
// its edge; and, if `cap`, anywhere it rises over the level it is
// flattened to it, rounding off over `soft` below, so nothing beyond
// the well stands higher than its rim. `level` is a height, or a
// function of x giving one (a level that falls away ahead of the well,
// say, so the body's top runs down in one curve). `height(h, x, z)` is the
// surface's new height over (x, z) where it was `h`, `reshaped` whether
// that differs from `h`, and `normal(n, h, x, z)` its new normal from
// its old one `n`.
export function leveller(well, level, { soft = 0.08, margin = 0.22, cap = true } = {}) {
  const { x0, x1, z1 } = well;
  const L = typeof level === "function" ? level : () => level;
  const eased = (x, z) => {
    const t = Math.min(1, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(Math.abs(z) - z1, 0)) / margin);
    return 1 - t * t * (3 - 2 * t);
  };
  const capped = (h, x) => {
    const l = L(x);
    return !cap || h < l - soft ? h : h > l + soft ? l : l - (l + soft - h) ** 2 / (4 * soft);
  };
  // how much of the old surface's slope the capped one keeps (the rest
  // being the level's own)
  const capSlope = (h, x) => {
    const l = L(x);
    return !cap || h < l - soft ? 1 : h > l + soft ? 0 : (l + soft - h) / (2 * soft);
  };
  const height = (h, x, z) => {
    const c = capped(h, x);
    return c + (L(x) - c) * eased(x, z);
  };
  const reshaped = (h, x, z) => eased(x, z) > 0 || (cap && h > L(x) - soft);
  // the old surface's slope from its normal, then the new one's: the
  // capped height's, eased toward the level by how near the well it is,
  // and the level's own slope along the car where it takes over
  const normal = (n, h, x, z) => {
    const e = 1e-3, w = eased(x, z), gx = -n.x / n.y, gz = -n.z / n.y;
    const ex = (eased(x + e, z) - eased(x - e, z)) / (2 * e), ez = (eased(x, z + e) - eased(x, z - e)) / (2 * e);
    const lx = (L(x + e) - L(x - e)) / (2 * e);
    const s = capSlope(h, x), k = s * (1 - w), c = L(x) - capped(h, x);
    return new THREE.Vector3(-(k * gx + lx * (1 - k) + c * ex), 1, -(k * gz + c * ez)).normalize();
  };
  return { eased, height, reshaped, normal };
}

// `geo` (with positions and normals) cut through by the `well`: every
// triangle trimmed against its footprint, keeping the parts outside it
// (behind, ahead and either side) and, inside it, the part under
// `floor`; then every vertex facing up is set on the levelled surface
// `L` (a leveller). A non-indexed geometry with positions and normals.
export function cutThrough(geo, well, floor, L) {
  const { x0, x1, z1 } = well, src = geo.index ? geo.toNonIndexed() : geo;
  const pos = src.attributes.position, nor = src.attributes.normal, P = [], N = [];
  const put = ({ p, n }) => {
    if (n.y > 0.05 && L.reshaped(p.y, p.x, p.z)) (n = L.normal(n, p.y, p.x, p.z)), (p = p.clone().setY(L.height(p.y, p.x, p.z)));
    P.push(p.x, p.y, p.z);
    N.push(n.x, n.y, n.z);
  };
  for (let i = 0; i < pos.count; i += 3) {
    const tri = [0, 1, 2].map((j) => ({ p: new THREE.Vector3().fromBufferAttribute(pos, i + j), n: new THREE.Vector3().fromBufferAttribute(nor, i + j) }));
    const xs = tri.map((v) => v.p.x), zs = tri.map((v) => v.p.z), ys = tri.map((v) => v.p.y);
    if (Math.max(...xs) <= x0 || Math.min(...xs) >= x1 || Math.min(...zs) >= z1 || Math.max(...zs) <= -z1 || Math.max(...ys) <= floor) {
      tri.forEach(put); // clear of the well, kept whole
      continue;
    }
    let rest = tri;
    const pieces = [];
    for (const [k, v, keep] of [["x", x0, -1], ["x", x1, 1], ["z", z1, 1], ["z", -z1, -1], ["y", floor, -1]]) {
      pieces.push(clipSide(rest, k, v, keep));
      rest = clipSide(rest, k, v, -keep);
      if (rest.length < 3) break;
    }
    for (const pc of pieces) for (let j = 1; j + 1 < pc.length; j++) [pc[0], pc[j], pc[j + 1]].forEach(put);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  return out;
}

// The cockpit's insides in the `well`, its floor at `floor` and its rim
// at `top`: `group` the car, `add` and `box` its own makers, `C` its
// colours (the
// walls, floor, lip and windshield frame in `wall`, the dashboard and
// steering wheel in `C.dash`, the seats in `C.trim`), `rake` how far
// the windshield leans back, in radians (0 stands it upright), `seats`
// 2 for the roadster's pair side by side, or 1 for a single seat in the
// middle with the steering wheel before it (a narrower well will do).
// Returns the top of the driver's cushion, for a driver to sit on.
export const RAKE = 0.35; // the windshield's and steering wheel's lean, the roadster's
export function fitCockpit({ group, add, box }, C, well, floor, top, wall = C.dash, rake = RAKE, seats = 2) {
  const { x0, x1, z1 } = well, both = { side: THREE.DoubleSide };

  // a floor, four walls up to the rim, and a solid lip round it: `RIM`
  // wide, straddling the cut edge, and `LIP` thick, a little proud of
  // the body
  box(x1 - x0, 0.04, 2 * z1, wall, (x0 + x1) / 2, floor - 0.02, 0);
  const quad = (a, b) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([a[0], floor - 0.02, a[1], a[0], top, a[1], b[0], floor - 0.02, b[1], b[0], top, b[1]], 3));
    g.setIndex([0, 2, 1, 1, 2, 3]);
    g.computeVertexNormals();
    return g;
  };
  for (const [a, b] of [[[x0, -z1], [x0, z1]], [[x1, -z1], [x1, z1]], [[x0, -z1], [x1, -z1]], [[x0, z1], [x1, z1]]]) add(quad(a, b), wall, 0, 0, 0, both);
  const RIM = 0.07, LIP = 0.05;
  for (const z of [-z1, z1]) box(x1 - x0 + RIM, LIP, RIM, wall, (x0 + x1) / 2, top + LIP / 2 - 0.02, z);
  for (const x of [x0, x1]) box(RIM, LIP, 2 * z1 + RIM, wall, x, top + LIP / 2 - 0.02, 0);

  // the dashboard against the front wall, just under the rim, and the
  // steering wheel before the left seat: its face toward the seats,
  // raked, on a short column into the dashboard's face
  const DASH = 0.22, DRIVER = seats === 1 ? 0 : -0.3, STEM = 0.18;
  box(DASH, 0.2, 2 * z1, C.dash, x1 - DASH / 2, top - 0.12, 0);
  const wheelAt = new THREE.Vector3(x1 - DASH - 0.14, top - 0.12, DRIVER);
  const rim = new THREE.TorusGeometry(0.16, 0.025, 10, 28).rotateY(Math.PI / 2).rotateZ(RAKE);
  add(rim, C.dash, wheelAt.x, wheelAt.y, wheelAt.z);
  add(new THREE.BoxGeometry(0.03, 0.3, 0.04).rotateZ(RAKE), C.dash, wheelAt.x, wheelAt.y, wheelAt.z); // one spoke up and down
  add(new THREE.BoxGeometry(0.03, 0.04, 0.3).rotateZ(RAKE), C.dash, wheelAt.x, wheelAt.y, wheelAt.z); // and one side to side
  const axis = new THREE.Vector3(Math.cos(RAKE), Math.sin(RAKE), 0); // the wheel's normal, toward the dash
  const column = new THREE.CylinderGeometry(0.03, 0.03, STEM, 10).rotateZ(-(Math.PI / 2 - RAKE));
  const columnAt = wheelAt.clone().addScaledVector(axis, STEM / 2);
  add(column, C.dash, columnAt.x, columnAt.y, columnAt.z);

  // two bucket seats on the floor (or the one, in the middle), their
  // backs leaning against the back wall
  const seatX = x0 + 0.45;
  for (const z of seats === 1 ? [0] : [-DRIVER, DRIVER]) {
    box(0.46, 0.26, 0.5, C.trim, seatX, floor + 0.13, z);
    const back = box(0.12, 0.5, 0.5, C.trim, seatX - 0.24, floor + 0.48, z);
    back.rotation.z = 0.22;
    seatHeadrest(add, box, C.trim, [seatX - 0.24, floor + 0.48], z, 0.26); // the headrest, straight over the backrest, on two metal posts
  }

  // the windshield: a pane in a frame, its top arched, standing on the
  // lip's front run and raked back from it like the roadster's. The
  // group's origin is on the lip's top, in the middle of its width, so
  // the frame's foot sits on the lip and only its back corner sinks a
  // hair into it as it leans; nothing reaches down into the body.
  const LIP_TOP = top + LIP - 0.02;
  const shield = new THREE.Group();
  shield.position.set(x1, LIP_TOP, 0);
  shield.rotation.z = rake;
  group.add(shield);
  const F = 0.045; // the frame's width
  const SW = 2 * z1 - 0.1, SIDE = 0.33, ARCH = 0.14, BASE = F; // the frame's foot on the lip, the arch's peak 0.5 over the rim as before
  // a shape across (x) and up (y): straight sides to `side`, the top an arch rising `arch` more
  const arched = (hw, bottom, side, arch) => {
    const sh = new THREE.Shape();
    sh.moveTo(-hw, bottom);
    sh.lineTo(hw, bottom);
    sh.lineTo(hw, side);
    sh.bezierCurveTo(hw * 0.6, side + arch * 1.35, -hw * 0.6, side + arch * 1.35, -hw, side);
    sh.closePath();
    return sh;
  };
  // laid across the car (shape x -> z) and thickened along it, centred
  const across = (geo, depth) => geo.translate(0, 0, -depth / 2).rotateY(-Math.PI / 2);
  const pane = add(across(new THREE.ExtrudeGeometry(arched(SW / 2, BASE, SIDE, ARCH), { depth: 0.03, bevelEnabled: false }), 0.03), C.glass, 0, 0, 0, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }, shield);
  pane.castShadow = false;
  const ring = arched(SW / 2 + F, BASE - F, SIDE, ARCH + F * 0.5);
  ring.holes.push(arched(SW / 2, BASE, SIDE, ARCH));
  add(across(new THREE.ExtrudeGeometry(ring, { depth: 0.05, bevelEnabled: false }), 0.05), wall, 0, 0, 0, undefined, shield); // the frame in the tray's colour, one piece with the lip

  return [seatX, floor + 0.26, DRIVER];
}
