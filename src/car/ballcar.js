/* ============================================================
   BALL CAR: the roadster (car.js) remade as a ball. The body is one
   round ball, a true sphere, in one of nine skins:
     tennis      optic yellow-green, the one white seam curving round it
                 in two lobes
     soccer      white, dark pentagons at the corners of an icosahedron
                 with thin dark seams between them
     baseball    white leather, the tennis ball's curve stitched in red
                 chevrons along a faint groove
     cricket     red leather, a raised seam round its belt with two rows
                 of pale stitches either side
     golf        white, dimpled all over
     whiffle     white plastic with eight oblong holes cut round the nose
     basketball  orange, dark lines: the equator, a meridian over the
                 top and one circle either side of it
     bowling     deep purple, the three finger holes bored into the nose
     pool        the black eight ball, a white spot on each flank with
                 its 8
   It is a ONE-SEATER: the COCKPIT is a narrow well cut into the top of
   the ball like a cookie cutter (tray.js), the skin eased up to its rim,
   so its rim is four straight, level lines, every triangle trimmed
   against the well's footprint, and a solid lip laid round the cut; in
   it a floor and four walls, one bucket seat in the middle, a dashboard
   and steering wheel before it, and a framed windshield raked back. A
   ball has a front and a back, so low on the nose are the headlights
   and low on the tail the tail lights. Under it, the roadster's four
   wheels with hubcaps on two axles hung from a dark chassis beam, tucked
   up under the belly so the ball sits low over them. Faces +X; its
   origin on the ground under the axles. Up is +Y.

   Seams, patches and stitches are laid on the skin by the sphere's own
   equation (and follow the top where it is eased round the well), and
   left off wherever the well is cut and under the belly. Holes are cut
   out of the shell itself, a dark lining inside showing through them.
   `finish(color, extra)` makes every material, so a page can hand in
   its own (the game's toon, or the stage's). `roll(dt, speed)` turns the
   wheels as the game does for a car going `speed` world units a second;
   `seat` is where the driver sits, the top of the one cushion.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { COCKPIT, RAKE, leveller, cutThrough, fitCockpit } from "./tray.js";

// `kind` the skin (above); `body` the ball, `seam` whatever is drawn on
// it (the tennis ball's white seam, the soccer ball's dark patches and
// seams, the baseball's and cricket ball's stitches, the basketball's
// lines, the pool ball's white spot), `inner` the dark inside seen
// through a whiffle ball's or bowling ball's holes, `trim` the seat and
// hubcaps, `dash` the cockpit's floor, walls and lip, the dashboard and
// steering wheel, `lamp` the headlights, `tail` the tail lights.
export const TENNISBALL = {
  scale: 1.6, // built 2.6 across; the game scales it up to fit a driver
  kind: "tennis",
  body: 0xcfe83a,
  seam: 0xfbfbf0,
  inner: 0x2a2a28,
  trim: 0xf3e3b4,
  dash: 0x3a3330,
  wheel: 0x232120,
  glass: 0xbfe3ec,
  lamp: 0xfff2b0,
  tail: 0xff6a4a,
  wheelR: 0.34,
};
export const SOCCERBALL = { ...TENNISBALL, kind: "soccer", body: 0xf6f6f2, seam: 0x1d1d20 };
export const BASEBALL = { ...TENNISBALL, kind: "baseball", body: 0xf3efe6, seam: 0xc8323a };
export const CRICKETBALL = { ...TENNISBALL, kind: "cricket", body: 0xb3262b, seam: 0xf2e6c8 };
export const GOLFBALL = { ...TENNISBALL, kind: "golf", body: 0xf5f5f0, seam: 0xf5f5f0 };
export const WHIFFLEBALL = { ...TENNISBALL, kind: "whiffle", body: 0xfbf6e4, seam: 0xfbf6e4, inner: 0x3a3a36 };
export const BASKETBALL = { ...TENNISBALL, kind: "basketball", body: 0xe07a2e, seam: 0x2b1a12 };
export const BOWLINGBALL = { ...TENNISBALL, kind: "bowling", body: 0x4b1a66, seam: 0x4b1a66, inner: 0x111111, trim: 0xe9dcc4 };
export const POOLBALL = { ...TENNISBALL, kind: "pool", body: 0x141414, seam: 0xf4f1e8, trim: 0xe9dcc4 };

// The ball, in the car's own units (before `scale`): a sphere of radius
// R about (0, CY, 0), its belly just off the ground. The WELL is the
// one-seat cockpit (tray.js) cut into its top, as long as every car's
// but narrower, its floor FLOOR and its rim TOP: set a little over the
// skin at the well's corners, so the skin is eased up to the rim all
// round it and only the crown of the ball is levelled flat.
const R = 1.3, CY = 1.4;
const WELL = { x0: -COCKPIT.len / 2, x1: COCKPIT.len / 2, z1: 0.42 }, TOP = CY + 1.13, FLOOR = TOP - COCKPIT.depth;
const LEVEL = leveller(WELL, TOP);
const LINING = 0.05, LEVEL_IN = leveller(WELL, TOP - LINING); // the lining inside a holed ball, that far under the shell
const AXLES = [-0.8, 0.8], TRACK = 0.74;
const BELLY = -0.9; // the skin below this height on the unit sphere is under the belly, out of sight

const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
// The skin's point and normal in the unit direction `u`, `off` proud of
// it: on the sphere, or on the top where it is eased round the well.
function skinAt(u, off = 0) {
  let p = new THREE.Vector3(R * u.x, CY + R * u.y, R * u.z), n = u.clone();
  if (u.y > 0.05 && LEVEL.reshaped(p.y, p.x, p.z)) {
    n = LEVEL.normal(n, p.y, p.x, p.z);
    p = p.setY(LEVEL.height(p.y, p.x, p.z));
  }
  return { p: p.addScaledVector(n, off), n };
}
const at = (u, off = 0) => skinAt(u, off).p;
// whether the skin in direction `u` is cut away or out of sight: in the
// well's footprint (and the lip round it), or under the belly
const hidden = (u) => {
  if (u.y < BELLY) return true;
  const p = at(u), M = 0.1;
  return u.y > 0 && Math.abs(p.x) < WELL.x1 + M && Math.abs(p.z) < WELL.z1 + M;
};
// A frame on the sphere about the unit direction `d`: `t` across it
// (level, or along x when d is near vertical) and `b` square to both,
// up the ball; or about `t0` as given.
const frameOf = (d, t0) => {
  const t = t0 ? t0.clone().normalize() : (Math.abs(d.y) < 0.9 ? Y.clone().cross(d) : X.clone().cross(d)).normalize();
  return [t, d.clone().cross(t)];
};
// the unit direction `rho` radians from `d`, at `th` round from `t`
const swing = (d, [t, b], rho, th) => d.clone().multiplyScalar(Math.cos(rho)).addScaledVector(t, Math.sin(rho) * Math.cos(th)).addScaledVector(b, Math.sin(rho) * Math.sin(th));

// A HOLE in the shell: an ellipse about `d`, `ra` radians along `t` and
// `rb` across it, and whether the direction `u` falls in it.
const hole = (d, ra, rb, t0) => {
  const [t, b] = frameOf(d, t0);
  const inside = (u) => {
    const c = u.dot(d);
    if (c <= 0) return false;
    const a = Math.atan2(u.dot(t), c), bb = Math.atan2(u.dot(b), c);
    return (a / ra) ** 2 + (bb / rb) ** 2 < 1;
  };
  const edge = (th) => (ra * rb) / Math.hypot(rb * Math.cos(th), ra * Math.sin(th));
  return { d, frame: [t, b], ra, rb, inside, edge };
};
// the golf ball's dimples: that many spread evenly over the sphere (a
// Fibonacci spiral), each a shallow round dent
const DIMPLES = 320, DIMPLE_R = 0.085, DIMPLE_D = 0.02;
function dimpleCentres() {
  const out = [], phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DIMPLES; i++) {
    const y = 1 - (2 * (i + 0.5)) / DIMPLES, r = Math.sqrt(1 - y * y), a = i * phi;
    out.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
  }
  return out;
}

// The ball: a sphere with the well cut through it and the top eased
// round the well's rim; `holes` cut out of it (every triangle touching
// one thrown away; a rim laid round each by the builder hides the
// ragged edge), dented by `dimples` if it has them. `radius` R, or less
// for the lining inside a holed ball, levelled a little lower.
function bodyGeometry({ holes = [], dimples = false, radius = R, level = LEVEL } = {}) {
  let g = new THREE.SphereGeometry(radius, 160, 100).translate(0, CY, 0);
  if (dimples) {
    const centres = dimpleCentres(), pos = g.attributes.position, nor = g.attributes.normal, u = new THREE.Vector3(), p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      u.fromBufferAttribute(nor, i);
      let best = null, bestAng = DIMPLE_R;
      for (const c of centres) {
        const ang = Math.acos(Math.min(1, u.dot(c)));
        if (ang < bestAng) (best = c), (bestAng = ang);
      }
      if (!best) continue;
      // a spherical dent: deepest at its centre, out to nothing at its
      // rim; the skin's normal tilted toward the centre by its slope
      const f = bestAng / DIMPLE_R, depth = DIMPLE_D * (1 - f * f), slope = (2 * DIMPLE_D * f) / (DIMPLE_R * radius);
      const toward = best.clone().addScaledVector(u, -u.dot(best)).normalize(); // along the skin, toward the dimple's centre
      p.fromBufferAttribute(pos, i).addScaledVector(u, -depth);
      pos.setXYZ(i, p.x, p.y, p.z);
      const n = u.clone().addScaledVector(toward, slope).normalize();
      nor.setXYZ(i, n.x, n.y, n.z);
    }
  }
  if (holes.length) {
    const src = g.toNonIndexed(), pos = src.attributes.position, nor = src.attributes.normal, keep = [], u = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      let cut = false;
      for (let k = 0; k < 3 && !cut; k++) {
        u.fromBufferAttribute(nor, i + k);
        cut = holes.some((h) => h.inside(u));
      }
      if (!cut) for (let k = 0; k < 3; k++) keep.push(i + k);
    }
    const P = new Float32Array(keep.length * 3), N = new Float32Array(keep.length * 3);
    keep.forEach((j, i) => {
      P.set([pos.getX(j), pos.getY(j), pos.getZ(j)], i * 3);
      N.set([nor.getX(j), nor.getY(j), nor.getZ(j)], i * 3);
    });
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(P, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
  }
  return cutThrough(g, WELL, FLOOR, level);
}

// Runs of consecutive visible samples of `dirs`, each a list of unit
// directions at least 4 long.
function runs(dirs, closed) {
  const ok = dirs.map((u) => !hidden(u)), out = [];
  let cur = [];
  const n = dirs.length;
  for (let i = 0; i < n; i++) {
    if (ok[i]) cur.push(dirs[i]);
    else {
      if (cur.length >= 4) out.push(cur);
      cur = [];
    }
  }
  if (cur.length >= 4) {
    if (closed && ok[0] && out.length && ok[n - 1]) out[0] = cur.concat(out[0]); // the run wraps round the seam's start
    else out.push(cur);
  }
  return out;
}

// The tennis ball's (and baseball's) seam: the classic curve, two lobes
// round the ball (x = cos t + b cos 3t, y = sin t - b sin 3t, z = c sin
// 2t), laid round the ball's belt with its waves up and down, turned so
// the lobes rise either side of the cockpit (not into its corners) and
// dip under the nose and the tail. `n` samples round, unit directions.
function tennisCurve(n = 360) {
  const B = 0.3, Cz = 2 * Math.sqrt(B), dirs = [], turn = Math.PI / 4;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const cx = Math.cos(t) + B * Math.cos(3 * t), cy = Math.sin(t) - B * Math.sin(3 * t), cz = Cz * Math.sin(2 * t);
    dirs.push(new THREE.Vector3(cx, cz, cy).normalize().applyAxisAngle(Y, turn)); // the curve's z becomes up
  }
  return dirs;
}
// a circle on the sphere: round the axis `axis`, `rho` radians from it
const circle = (axis, rho, n = 180) => {
  const f = frameOf(axis);
  return Array.from({ length: n }, (_, i) => swing(axis, f, rho, (i / n) * Math.PI * 2));
};

// The twelve corners of an icosahedron, one straight up (where the
// cockpit is) and one straight down (under the belly), the five round
// the top turned so one looks over the nose, and so the five round the
// bottom have one under the tail.
function icoVertices() {
  const v = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)], el = Math.atan(0.5); // the rings' elevation, 26.57 degrees
  for (let k = 0; k < 5; k++) {
    const az = (k / 5) * Math.PI * 2;
    v.push(new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)));
    v.push(new THREE.Vector3(Math.cos(el) * Math.cos(az + Math.PI / 5), -Math.sin(el), Math.cos(el) * Math.sin(az + Math.PI / 5)));
  }
  return v;
}

export function buildBallCar(finish, C = TENNISBALL) {
  const group = new THREE.Group(),
    wheels = [];
  const add = (geo, color, x, y, z, extra, parent = group) => {
    const mesh = new THREE.Mesh(geo, finish(color, extra));
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d, color, x, y, z, extra, parent) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z, extra, parent);
  // Something stood on the skin: `geo` built standing up from its base
  // at the origin, turned to the skin's normal in direction `u`.
  const stickOn = (u, geo, color, extra, sink = 0) => {
    const mesh = add(geo, color, 0, 0, 0, extra), { p, n } = skinAt(u, -sink);
    mesh.position.copy(p);
    mesh.quaternion.setFromUnitVectors(Y, n);
    return mesh;
  };
  // a line along the skin through the unit directions `dirs`, a tube
  // `r` thick, `off` proud of the skin
  const tubeGeo = (dirs, off, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dirs.map((u) => at(u, off))), Math.max(8, dirs.length * 2), r, 6, false);
  const tube = (dirs, off, r, color) => add(tubeGeo(dirs, off, r), color, 0, 0, 0);
  // a short straight rod along the skin from direction `a` to `b`
  const rodGeo = (a, b, off, r) => {
    const p = at(a, off), q = at(b, off), len = p.distanceTo(q);
    const g = new THREE.CylinderGeometry(r, r, len, 6).translate(0, len / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, q.clone().sub(p).normalize()));
    return g.translate(p.x, p.y, p.z);
  };
  // A patch lying on the skin about direction `d`, a hair proud: a fan
  // of rings from `inner(th)` radians out to `edge(th)` (th round from
  // the frame's `t`), each ring laid on the sphere, so it hugs the curve.
  // With no `inner` it is a solid cap.
  const patchGeo = (d, edge, { inner = () => 0, off = 0.016, frame = frameOf(d), rings = 4, seg = 40 } = {}) => {
    const P = [], N = [], I = [];
    for (let r = 0; r <= rings; r++)
      for (let s = 0; s < seg; s++) {
        const th = (s / seg) * Math.PI * 2, rho = inner(th) + ((edge(th) - inner(th)) * r) / rings;
        const { p, n } = skinAt(swing(d, frame, rho, th), off);
        P.push(p.x, p.y, p.z);
        N.push(n.x, n.y, n.z);
      }
    for (let r = 0; r < rings; r++)
      for (let s = 0; s < seg; s++) {
        const a = r * seg + s, b2 = r * seg + ((s + 1) % seg), c = a + seg, e = b2 + seg;
        I.push(a, c, b2, b2, c, e);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
    g.setIndex(I);
    return g;
  };
  // whether a patch about `d` out to `edge` is wholly on show
  const shown = (d, edge, frame = frameOf(d)) => !hidden(d) && Array.from({ length: 8 }, (_, k) => swing(d, frame, edge((k / 8) * Math.PI * 2), (k / 8) * Math.PI * 2)).every((u) => !hidden(u));
  const both = { side: THREE.DoubleSide };

  // the holes a whiffle ball or bowling ball has, cut out of the shell
  const holes = [];
  if (C.kind === "whiffle") {
    // eight oblong holes in a ring round the nose, 45 degrees off it,
    // each lying along the ring, none straight over or under
    for (let k = 0; k < 8; k++) {
      const az = ((k + 0.5) / 8) * Math.PI * 2, d = new THREE.Vector3(Math.SQRT1_2, Math.SQRT1_2 * Math.cos(az), Math.SQRT1_2 * Math.sin(az));
      holes.push(hole(d, 0.2, 0.1, X.clone().cross(d)));
    }
  } else if (C.kind === "bowling") {
    // two finger holes side by side high on the nose, the thumb hole
    // below them
    for (const s of [-1, 1]) holes.push(hole(new THREE.Vector3(Math.cos(0.7) * Math.cos(0.2), Math.sin(0.7), s * Math.cos(0.7) * Math.sin(0.2)).normalize(), 0.085, 0.085));
    holes.push(hole(new THREE.Vector3(Math.cos(0.34), Math.sin(0.34), 0), 0.1, 0.1));
  }

  // the ball, two-sided so what little of the inside the well's walls
  // miss shows skin, not nothing; holed, a dark lining inside it, and a
  // rim round each hole, in the ball's own colour, over the cut's edge
  add(bodyGeometry({ holes, dimples: C.kind === "golf" }), C.body, 0, 0, 0, both);
  if (holes.length) {
    add(bodyGeometry({ radius: R - LINING, level: LEVEL_IN }), C.inner, 0, 0, 0, { side: THREE.BackSide });
    const rims = holes.map((h) => tubeGeo(Array.from({ length: 41 }, (_, i) => swing(h.d, h.frame, h.edge((i / 40) * Math.PI * 2) + 0.025, (i / 40) * Math.PI * 2)), 0, 0.04));
    add(mergeGeometries(rims), C.body, 0, 0, 0);
  }

  // the cockpit, cut into the top (tray.js): one seat, in the middle
  const seat = fitCockpit({ group, add, box }, C, WELL, FLOOR, TOP, C.dash, RAKE, 1);

  if (C.kind === "soccer") {
    const verts = icoVertices(), PR = 0.3; // a pentagon's angular radius (radians on the unit sphere)
    const pentagon = (th) => {
      const m = ((th % (Math.PI * 2 / 5)) + Math.PI * 2 / 5) % (Math.PI * 2 / 5);
      return (PR * Math.cos(Math.PI / 5)) / Math.cos(m - Math.PI / 5);
    };
    // every pentagon wholly on show: the top one is where the cockpit is
    // cut, the bottom one under the belly
    const patches = verts.filter((d) => shown(d, pentagon)).map((d) => patchGeo(d, pentagon));
    if (patches.length) add(mergeGeometries(patches), C.seam, 0, 0, 0, both);
    // the seams: along each icosahedron edge, from one pentagon's rim
    // to the next, a thin great-circle arc (the ones from the top
    // corner run out from under the cockpit's lip)
    const seams = [];
    for (let i = 0; i < verts.length; i++)
      for (let j = i + 1; j < verts.length; j++) {
        if (verts[i].angleTo(verts[j]) > 1.2) continue; // neighbours only (63.4 degrees apart)
        const ang = verts[i].angleTo(verts[j]), pts = [];
        for (let k = 0; k <= 16; k++) {
          const f = (PR * 0.9 + ((ang - PR * 1.8) * k) / 16) / ang;
          pts.push(verts[i].clone().multiplyScalar(Math.sin((1 - f) * ang)).addScaledVector(verts[j], Math.sin(f * ang)).divideScalar(Math.sin(ang)).normalize());
        }
        seams.push(...runs(pts, false));
      }
    for (const s of seams) tube(s, 0.004, 0.02, C.seam);
  } else if (C.kind === "tennis") {
    for (const s of runs(tennisCurve(), true)) tube(s, 0.008, 0.032, C.seam);
  } else if (C.kind === "baseball") {
    // the same curve, a faint groove with red chevrons stitched across
    // it: every few samples a pair of short rods meeting on the seam
    // ahead, from either side
    const curve = tennisCurve(720), groove = new THREE.Color(C.body).multiplyScalar(0.9).getHex();
    for (const s of runs(curve, true)) tube(s, 0.002, 0.012, groove);
    const stitches = [], W = 0.045, AHEAD = 0.05, n = curve.length;
    for (let i = 0; i < n; i += 7) {
      const u = curve[i], t = curve[(i + 1) % n].clone().sub(curve[(i + n - 1) % n]).normalize(), side = u.clone().cross(t).normalize();
      const tip = u.clone().addScaledVector(t, AHEAD).normalize();
      if (hidden(u) || hidden(tip)) continue;
      for (const sg of [-1, 1]) stitches.push(rodGeo(u.clone().addScaledVector(side, sg * W).normalize(), tip, 0.012, 0.014));
    }
    add(mergeGeometries(stitches), C.seam, 0, 0, 0);
  } else if (C.kind === "cricket") {
    // the seam round the belt: a raised ridge a shade darker than the
    // leather, and a row of short pale stitches along either side of it
    const ridge = new THREE.Color(C.body).multiplyScalar(0.72).getHex();
    for (const s of runs(circle(Y, Math.PI / 2, 240), true)) tube(s, 0.012, 0.035, ridge);
    const stitches = [], n = 96;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + ((0.55 / n) * Math.PI * 2);
      for (const el of [-0.055, 0.055]) {
        const a = new THREE.Vector3(Math.cos(el) * Math.cos(a0), Math.sin(el), Math.cos(el) * Math.sin(a0)), b = new THREE.Vector3(Math.cos(el) * Math.cos(a1), Math.sin(el), Math.cos(el) * Math.sin(a1));
        if (!hidden(a) && !hidden(b)) stitches.push(rodGeo(a, b, 0.014, 0.012));
      }
    }
    add(mergeGeometries(stitches), C.seam, 0, 0, 0);
  } else if (C.kind === "basketball") {
    // the lines: the equator, the meridian over the nose and tail (it
    // dives under the cockpit's lip), and a circle either side of it
    const lines = [...runs(circle(Y, Math.PI / 2, 240), true), ...runs(circle(new THREE.Vector3(0, 0, 1), Math.PI / 2, 240), true)];
    for (const s of [-1, 1]) lines.push(...runs(circle(new THREE.Vector3(0, 0, s), Math.PI / 3, 200), true));
    for (const s of lines) tube(s, 0.004, 0.024, C.seam);
  } else if (C.kind === "pool") {
    // the eight ball's spot on each flank, a white disc a little forward
    // and up, and its 8: two dark rings stacked on it, the top one the
    // smaller
    const SPOT = 0.33;
    for (const s of [-1, 1]) {
      const d = new THREE.Vector3(0.12, 0.28, s).normalize(), frame = frameOf(d);
      if (!shown(d, () => SPOT, frame)) continue;
      add(patchGeo(d, () => SPOT, { frame }), C.seam, 0, 0, 0, both);
      const loops = [[0.115, 0.055, 0.1], [-0.12, 0.062, 0.112]]; // up the spot, inner and outer radii
      for (const [up, ri, ro] of loops) add(patchGeo(swing(d, frame, Math.abs(up), up > 0 ? Math.PI / 2 : -Math.PI / 2), () => ro, { inner: () => ri, off: 0.024, rings: 2 }), C.body, 0, 0, 0, both);
    }
  }
  // (golf, whiffle and bowling have nothing more laid on the skin)

  // headlights low on the nose, either side, and tail lights low on the
  // tail, a little wider apart, clear of the pentagon under the tail
  const lampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16).translate(0, 0.04, 0);
  const tailGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14).translate(0, 0.03, 0);
  const EL = -0.42; // elevation below the equator
  const lampDir = (front, az, s) => new THREE.Vector3(front * Math.cos(EL) * Math.cos(az), Math.sin(EL), s * Math.cos(EL) * Math.sin(az)).normalize();
  for (const s of [-1, 1]) {
    stickOn(lampDir(1, 0.34, s), lampGeo, C.lamp, { emissive: C.lamp, emissiveIntensity: 0.6 }, 0.03);
    stickOn(lampDir(-1, 0.5, s), tailGeo, C.tail, { emissive: C.tail, emissiveIntensity: 0.5 }, 0.02);
  }

  // the chassis: a dark beam under the belly, the two axles across it,
  // and four wheels, each with a hubcap, turning on an axle along z
  box(2.0, 0.16, 0.3, C.dash, 0, C.wheelR + 0.06, 0);
  const axleGeo = new THREE.CylinderGeometry(0.045, 0.045, 2 * TRACK + 0.2, 10).rotateX(Math.PI / 2);
  const wheelGeo = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.22, 18).rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(C.wheelR * 0.45, C.wheelR * 0.45, 0.25, 12).rotateX(Math.PI / 2);
  for (const x of AXLES) {
    add(axleGeo, C.dash, x, C.wheelR, 0);
    for (const z of [-TRACK, TRACK]) {
      const w = add(wheelGeo, C.wheel, x, C.wheelR, z);
      add(capGeo, C.trim, 0, 0, 0, undefined, w);
      wheels.push(w);
    }
  }
  group.scale.setScalar(C.scale);
  const roll = (dt, speed) => {
    for (const w of wheels) w.rotation.z -= (speed * dt) / C.wheelR;
  };
  return { group, wheels, roll, seat };
}
