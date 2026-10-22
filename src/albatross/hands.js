// Stone arms, reaching up out of the earth around the foot of a statue, as
// if the buried giant's arms come up through the mound: a hand on a
// forearm, an elbow, and an upper arm that goes down into the ground.
//
// The hand is the planar hand (reference/planar-hand.html), built the way
// the heads are: every piece (the palm, the wrist and arm, each finger
// bone) is a high-res sphere pushed onto an ellipsoid and carved by flat
// planes, each vertex taking the normal of the plane it landed on, so the
// planes read as crisp flats while the uncut parts stay smoothly round.
// The reference poses its hand with a live hierarchy of hinge groups; here
// the same hinge transforms are composed as matrices and each bone is
// baked in place, once per pose, since the arms are instanced geometry.
//
// The arm is laid out in the statues' neck frame, so the neck shaders do
// the rest (statues.js patchBend): the hand and forearm are the rigid part
// above the stretch line, like the head; the upper arm is the straight zone
// below it, stretched to any length by aStretch and bent near its top by
// aCurl, which is the elbow. The foot of the upper arm is buried, like the
// neck's.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ConvexHull } from "three/addons/math/ConvexHull.js";
import { STRETCH_FROM, V, clean } from "./heads.js";

// How many arms each statue has, how big, where, and how deep: what the
// pillars lab slides. `pose` is a name from HAND_POSES, or "mixed".
export const HANDS = {
  count: 2, // arms per statue (0 = none)
  onStatues: false, // arms on the statues at all: off, the arms are the lone ones coming up out of the ground (main.field.js LONE); the pillars lab still shows them on its pillars
  minSize: 6, // head scale a statue must reach to have arms: smaller ones are heads alone (the field's BIG heads are 4 – 5.5, MASSIVE 7 – 9)
  size: 1, // relative to the head: 1 is a hand about as long as the face
  gap: 1.4, // head units the arm's column keeps out from the neck's wall, past its own radius
  reach: [0.2, 1.2], // head units the hand stands out past the nearest it can (its column gap out from the neck's wall): drawn per arm from this range, so a statue's arms stand at their own distances
  bury: 0, // head units lower than the pose's own elbow height
  rise: [0.15, 0.25], // head units the elbow lifts per head unit of neck, drawn per arm from this range: 0 keeps the hands low however tall the pillar; 0.2 lifts a five-unit pillar's elbows a whole unit
  pose: "mixed",
  // At rest, reaching for the sky: every hand open (the "reach" pose), its
  // forearm near upright and leaning out from the body, the pair in a V.
  // They reach for the bird when it comes near, and back up when it goes.
  // Off: each rests in its own pose (pose), bent as that pose has it
  sky: true,
  skyLean: [0.12, 0.38], // radians the forearm leans off upright at rest, drawn per arm
  column: 1, // the upper arm, from the ground up to the elbow, as a stone column: this many times the arm's girth (1 = an arm), narrowing to the forearm under the elbow
  elbowLean: [0.1, 0.55], // radians the forearm leans in at a slight, fixed elbow (toward the palm: in toward the head), drawn per arm; the statue never moves it, only the wrist
  thumbIn: 0.45, // reaching for the sky, radians each hand turns past facing the head with its palm, swinging its thumb toward the head
  skyAbove: 1, // reaching for the sky, the elbow stands high enough that the fingertips reach this far above the top of the head (head units): the arms higher than the head
  detail: 0.45, // how finely the arms are carved: 1 is full detail, fewer is lighter (vertices go with its square)
  // Where the hands stand: a pair either side of the statue's facing, in
  // front of it, each turned a little in toward the middle (as the
  // animation lab dealt them); a second pair sits further out
  spread: 0.85, // radians either side of the facing the hands' bearings sit (wide: the arms stand apart)
  spreadStep: 0.5, // radians further out for each pair beyond the first
  toeIn: 0.15, // radians each hand turns in toward the facing
  loose: 0.45, // radians of play in each of those, drawn per hand
  // A head coming down over a hand presses it flat: the hand folds further
  // at the elbow, lowering toward the ground, until the head clears it.
  // The elbow never moves and the hand is never pushed forward or lifted;
  // it only turns about the elbow, and only as far as lying on the ground
  press: 0.4, // of the arm's scale: how close a head may come before the hand lowers, and the room it makes
  pressRate: 2, // radians a second the hand lowers, at most (a head bends at 1.4)
  pressRelax: 0.6, // radians a second it comes back up once the head has gone
  // The wiper arm (the pillars lab only, for now): the upper arm comes up
  // out of the mound at a slant, not straight up, and the elbow's hinge
  // stands upright, so bending it sweeps the forearm left and right; the
  // slant (the shoulder) lifts the whole arm up and down
  wiper: false,
  lift: 0.35, // radians the upper arm rises from the ground
  sweep: 1.5, // radians the elbow sweeps the forearm sideways (each hand of a pair the mirror of the other): about 1.57 is square to the upper arm
  bend: 0.3, // head units of upper arm the elbow's bend takes up: short, so it reads as a joint between two straight bones (a neck bends over half its length)
};
export const PRESS_STEP = 0.05; // radians between the folds tried while looking for one that clears the head
export const PRESS_EASE = 0.2; // seconds the press is smoothed over as a head eases off (coming down it is followed at once): a wobbling head never ratchets the hand
// How much further a hand must fold, past `curl`, for a head over it to
// clear it by `margin`: room(c) is how far (world units) the nearest head
// is from the arm at fold c, need(c) how far the hand would have to lift
// at fold c to be clear of the ground. Tried in PRESS_STEP folds up to
// maxCurl and read off between them, so the answer moves smoothly with
// the head; a hand that can't make the room lies on the ground; one that
// is on it already (or clear by the margin) stays where it is (0).
export function pressFold(curl, room, need, margin, maxCurl) {
  let r0 = room(curl);
  if (r0 >= margin) return 0;
  let n0 = need(curl),
    f0 = 0;
  for (let f = PRESS_STEP; curl + f <= maxCurl; f += PRESS_STEP) {
    const n = need(curl + f);
    if (n > 0) return n0 < 0 ? f0 + (f - f0) * (-n0 / (n - n0)) : f0; // the ground: as far as just touching it
    const r = room(curl + f);
    if (r >= margin) return f0 + (f - f0) * ((margin - r0) / Math.max(1e-9, r - r0)); // the room made: just enough
    r0 = r;
    n0 = n;
    f0 = f;
  }
  return f0;
}
// Where a pose's elbow stands, in the arm's units above the ground, on a
// statue whose neck is neckH head units tall: the pose's own height, less
// the bury, plus the rise for the neck (u: the arm's 0..1 draw in H.rise).
// Reaching for the sky (H.sky), at least as high as puts the fingertips
// H.skyAbove head units over the top of the head (about 2 head units over
// the neck), the forearm and hand standing near upright on the elbow
export const elbowUp = (hp, neckH, u, H = HANDS) => {
  const own = hp.elbowUp - H.bury + (H.rise[0] + u * (H.rise[1] - H.rise[0])) * neckH;
  if (!H.sky) return own;
  const armUnit = armSize(H.size) * 0.85; // the arm's scale, of the head's
  return Math.max(own, (neckH + 2 + H.skyAbove) / armUnit - (FOREARM + HAND_LONG) * Math.cos(H.skyLean[1]));
};
// An arm at rest: its pose's name and its wrist's bend, from its draws
// (pick: 0..1 for the pose, u: 0..1 for the bend). Its pose is H.pose, or a
// drawn one if "mixed"; reaching for the sky (H.sky) it leans off upright
// by skyLean, else bent as its pose has it, give or take `vary` radians
export const OPEN_POSES = ["reach", "flat", "cup"]; // the hands that reach for the sky are open ones (the fist is for grabbing)
export function armRest(H, pick, u, vary = 0.15) {
  const names = H.sky ? OPEN_POSES : POSE_NAMES;
  const name = H.pose === "mixed" ? names[Math.floor(pick * names.length)] : H.pose; // each its own pose: open ones, reaching for the sky
  if (H.sky) return { name, curl: H.skyLean[0] + u * (H.skyLean[1] - H.skyLean[0]) };
  return { name, curl: HAND_POSES[name].elbow + (u * 2 - 1) * vary };
}
// An arm's fixed elbow lean, as the elbow lane takes it (the tangent of its
// angle), from its 0..1 draw in H.elbowLean
export const elbowTan = (H, u) => Math.tan(H.elbowLean[0] + u * (H.elbowLean[1] - H.elbowLean[0]));
// The k-th hand's bearing from the foot and the way it faces, for a
// statue facing `facing`: draw(n) is the hand's own 0..1 draw for lane n.
// Reaching for the sky (H.sky), each turns its palm in to face the head
// (so its rest lean tips it in over the head), then a little further round
// (H.thumbIn), swinging its thumb's edge toward the head too (thumbSide
// picks the hand whose thumb that is), the pair the mirror of each other
export function handBearing(k, facing, draw, H = HANDS) {
  const side = k % 2 ? -1 : 1,
    pair = Math.floor(k / 2);
  const loose = (n) => (draw(n) * 2 - 1) * H.loose;
  const a = facing + side * (H.spread + pair * H.spreadStep) + loose(2);
  return { a, yaw: H.sky ? a + Math.PI + side * H.thumbIn + loose(4) * 0.5 : facing - side * H.toeIn + loose(4) };
}
// A hand's yaw held on the side of its rest: turned past the point where
// its thumb would face away from the neck, the hand would have to swap to
// the other hand, which flips it in a frame. So a move's target yaw is
// kept inside the rest's half-turn, a margin short of the edge.
export function sameSideYaw(hx, hz, restYaw, yaw, margin = 0.15) {
  const phi = Math.atan2(hz, hx); // hx cos(yaw) - hz sin(yaw) = R cos(yaw + phi)
  const centre = Math.cos(restYaw + phi) > 0 ? -phi : Math.PI - phi;
  let d = yaw - centre;
  d = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return centre + Math.max(-(Math.PI / 2 - margin), Math.min(Math.PI / 2 - margin, d));
}
// The hand never goes into the ground (the wrist and arm may). For that,
// the hand's outline: the convex hull of its vertices (those past the
// wrist) in the plane the elbow's fold turns in (y up the arm, z toward
// the palm), each point with its x, all relative to the elbow point (the
// arm's axis at STRETCH_FROM). For a fold of `curl` the hand's lowest
// point is the hull point with the least y cos(curl) - z sin(curl).
export const HAND_CLEAR = 0.05; // world units the hand's lowest point keeps above the ground
export function handHull(geometry, axis = { x: 0, z: 0 }) {
  const pos = geometry.attributes.position;
  const pts = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) - STRETCH_FROM;
    if (y < FOREARM - 0.05) continue;
    pts.push({ x: pos.getX(i) - axis.x, y, z: pos.getZ(i) - axis.z });
  }
  pts.sort((a, b) => a.y - b.y || a.z - b.z);
  const cross = (o, a, b) => (a.y - o.y) * (b.z - o.z) - (a.z - o.z) * (b.y - o.y);
  const lower = [],
    upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
// The hand's lowest point for a fold: how far (in the arm's scale) under
// the elbow's height it reaches, and where it lies in the geometry's frame
// (x, and z along the fold) for reading the ground under it
export function handLow(hull, curl) {
  const c = Math.cos(curl),
    s = Math.sin(curl);
  let low = Infinity,
    at = hull[0];
  for (const p of hull) {
    const v = p.y * c - p.z * s;
    if (v < low) {
      low = v;
      at = p;
    }
  }
  return { low, x: at.x, z: at.y * s + at.z * c };
}
// The whole hand against the ground: every point of it that can touch
// (the vertices of its 3D convex hull: fingertips, knuckles, the palm's
// underside, the heel), relative to the elbow point, with their center.
// handNeed folds them by the elbow's curl, turns them by the arm's yaw,
// scales and sets them in the world, and asks the ground under each; it
// answers how far (world units) the arm must rise so none is under it.
export function handPoints(geometry, axis = { x: 0, z: 0 }) {
  const pos = geometry.attributes.position;
  const pts = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) - STRETCH_FROM;
    if (y < FOREARM - 0.05) continue;
    pts.push(new THREE.Vector3(pos.getX(i) - axis.x, y, pos.getZ(i) - axis.z));
  }
  // The hull's corners, read off its faces (its .vertices is every point given it)
  const corners = new Set();
  for (const face of new ConvexHull().setFromPoints(pts).faces) {
    let e = face.edge;
    do {
      corners.add(e.head());
      e = e.next;
    } while (e !== face.edge);
  }
  const points = [...corners].map((v) => ({ x: v.point.x, y: v.point.y, z: v.point.z }));
  const centre = points.reduce((c, p) => ({ x: c.x + p.x / points.length, y: c.y + p.y / points.length, z: c.z + p.z / points.length }), { x: 0, y: 0, z: 0 });
  return { points, centre };
}
// A hand point set in the world: folded, turned, scaled, from the elbow at
// (ax, base + up * sc, az)
const placeHandPoint = (p, c, s, sy, cy, sc, ax, az, base, up) => {
  const y = p.y * c - p.z * s,
    z = p.y * s + p.z * c;
  return { x: ax + sc * (p.x * cy + z * sy), y: base + sc * (up + y), z: az + sc * (-p.x * sy + z * cy) };
};
export function handCentre(hand, curl, yaw, sc, ax, az) {
  return placeHandPoint(hand.centre, Math.cos(curl), Math.sin(curl), Math.sin(yaw), Math.cos(yaw), sc, ax, az, 0, 0);
}
export function handNeed(hand, curl, yaw, sc, ax, az, base, up, ground, clear = HAND_CLEAR) {
  const c = Math.cos(curl),
    s = Math.sin(curl),
    sy = Math.sin(yaw),
    cy = Math.cos(yaw);
  let need = -Infinity;
  for (const p of hand.points) {
    const w = placeHandPoint(p, c, s, sy, cy, sc, ax, az, base, up);
    need = Math.max(need, ground(w.x, w.z) + clear - w.y);
  }
  return need;
}
// A hand is never smaller than this share of the head's height, whatever
// HANDS.size (or the lab's slider) asks for: a head is HEAD_TALL head
// units tall, a hand HAND_LONG as built, so the arm's scale for a head of
// size s is s * armSize(size) * 0.85
export const HAND_MIN = 0.8; // of the head's height
export const HEAD_TALL = 2, // head units, about
  HAND_LONG = 1.45; // head units, heel to middle fingertip, as built
// Which hand goes at a spot so its thumb points at the neck: the right
// hand's thumb lies on its -x, the left's on +x; turned by the arm's yaw,
// -x runs along (-cos yaw, sin yaw). (hx, hz) is the hand's spot from the
// foot. 0 = the right hand (built for side +1), 1 = the left. (The sign
// here was found by looking: with it the other way round every hand came
// out thumb-outward.)
export const thumbSide = (hx, hz, yaw) => (hx * Math.cos(yaw) - hz * Math.sin(yaw) > 0 ? 1 : 0);
export const armSize = (size = HANDS.size) => Math.max(size, (HAND_MIN * HEAD_TALL) / (HAND_LONG * 0.85));

// curl:    0 – 1, the reference's curl: 1 folds the first two segments to 90°
// spread:  0 – 1, the reference's spread: how far the fingers fan apart
// wrist:   the hand's flex at the wrist (radians; positive folds it toward the palm)
// elbow:   the bend at the elbow (radians; 0 = the arm straight)
// elbowUp: how high the elbow stands above the ground (head units;
//          negative = buried, the forearm rising out of the earth)
export const HAND_POSES = {
  // lying flat on the earth, palm down, the forearm coming up behind it
  flat: { curl: 0.2, spread: 0.35, wrist: 0.1, elbow: 1.4, elbowUp: -0.5 },
  // fingers dug into the ground
  grip: { curl: 0.65, spread: 0.3, wrist: 0.3, elbow: 1.25, elbowUp: -0.35 },
  // reaching up, open to the sky, the hand tipped back
  reach: { curl: 0.1, spread: 0.7, wrist: -0.25, elbow: 0.3, elbowUp: 0.6 },
  // half closed, as if to catch something
  cup: { curl: 0.45, spread: 0.2, wrist: 0.25, elbow: 0.9, elbowUp: 0.3 },
  // a fist
  fist: { curl: 1, spread: 0.05, wrist: 0, elbow: 0.6, elbowUp: 0.4 },
};
export const POSE_NAMES = Object.keys(HAND_POSES);

// The arm's proportions (head units). The reference hand is 1.87 of its own
// units from the heel of the hand to the middle fingertip; HAND_SCALE makes
// that 1.45 head units, about the length of a face.
// The arm bends at the wrist, not the elbow: it is one straight column from
// the ground up to the heel of the hand, and the joint the shaders bend
// (the stretch line) is the wrist. FOREARM, what stands above the joint
// before the hand, is so nothing; the forearm is still built (FOREARM_BUILT
// long) but as the top of the column
const FOREARM_BUILT = 1.5; // the built forearm, heel of the hand down to where an elbow was
export const FOREARM = 0; // head units above the joint before the heel of the hand: none, the joint is the wrist
export const WRIST_B = 0.3; // arm units the wrist's bend takes up (a neck bends over half its length; the bend lane, bendCap, holds an arm to this)
export const ELBOW_DOWN = 2.2; // how far under the wrist the fixed elbow stands, arm units: a little past the built forearm (was 1.5; statues.js has it too)
export const WRIST_MAX = 1.2; // radians the wrist bends at most, reaching for the bird
const COLUMN_NECK = 0.12; // geometry units under the elbow the column takes to reach its full girth (the stretched zone is 1 unit, drawn out to the column's height)
const HAND_SCALE = 1.45 / 1.87;
const HEEL = -0.41; // where the heel of the hand ends (reference units): the wrist hinge

// =====================================================================
// A carved part: an ellipsoid (center C, radii R) sliced by flat planes,
// exactly as in the reference. A sphere pushed onto the carved ellipsoid;
// each vertex takes the normal of the plane it landed on.
// =====================================================================
const plane = (n, p) => {
  const v = V(...n).normalize();
  return { n: v, d: v.dot(V(...p)) };
};
// How finely every carved part is divided, as a share of its full detail
// (buildArm sets it for the arm it is building, from its `detail`)
let detailNow = 1;
function carvedPart(C, R, planes, segs = [40, 32], least = [8, 6]) {
  segs = segs.map((n, k) => Math.max(least[k], Math.round(n * detailNow)));
  const carve = (p) => {
    for (let it = 0; it < 12; it++)
      for (const pl of planes) {
        const e = pl.n.dot(p) - pl.d;
        if (e > 0) p.addScaledVector(pl.n, -e);
      }
    return p;
  };
  const geo = new THREE.SphereGeometry(1, segs[0], segs[1]);
  const pos = geo.attributes.position,
    nor = geo.attributes.normal,
    d = V(),
    n = V();
  const tol = 1e-4 * Math.max(R.x, R.y, R.z) * 3;
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i);
    const p = carve(V(C.x + d.x * R.x, C.y + d.y * R.y, C.z + d.z * R.z));
    pos.setXYZ(i, p.x, p.y, p.z);
    n.set(0, 0, 0);
    for (const pl of planes) if (Math.abs(pl.n.dot(p) - pl.d) < tol) n.add(pl.n);
    if (n.lengthSq() === 0) n.set((p.x - C.x) / (R.x * R.x), (p.y - C.y) / (R.y * R.y), (p.z - C.z) / (R.z * R.z));
    n.normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// One finger bone, in its own frame: runs from y = 0 (the joint) to y = len.
// An octagonal-ish section: flat back, flat palm side, flat sides, bevelled
// back corners. flare: how much wider the base is than the top; the side
// planes lean inward as they rise, so the bone swells toward its root.
// ext: how far the root reaches back below the hinge, into the palm.
function bone(len, r, { tip = false, flare = 0, ext = 0 } = {}) {
  const lo = -ext,
    mid = (len + lo) / 2,
    half = (len - lo) / 2;
  const C = V(0, mid, 0),
    R = V(r * (1 + flare * 1.4), half + r * 0.55, r * (0.9 + flare * 0.4));
  const lean = (flare * r) / len;
  const pl = [
    plane([0, 0, 1], [0, 0, r * 0.62]), // back of the finger
    plane([0, (flare * 0.35 * r) / len, -1], [0, 0, -r * 0.66 * (1 + flare * 0.4)]), // palm side, fuller at the root
    plane([1, lean, 0], [r * 0.82 * (1 + flare), 0, 0]), // sides
    plane([-1, lean, 0], [-r * 0.82 * (1 + flare), 0, 0]),
    plane([1, lean, 1.1], [r * 0.6 * (1 + flare), 0, r * 0.42]), // back bevels
    plane([-1, lean, 1.1], [-r * 0.6 * (1 + flare), 0, r * 0.42]),
  ];
  if (tip) {
    pl.push(plane([0, 0.55, 1], [0, len * 0.72, r * 0.5])); // nail plane
    pl.push(plane([0, 1, -0.35], [0, len + r * 0.15, 0])); // squared fingertip
  }
  return carvedPart(C, R, pl, [28, 24]);
}

// A chain of bones joined at hinges, baked: `frames` are the hinge
// rotations (Matrix4) in order; each bone goes in its joint's frame, which
// sits `len` up the previous bone. Returns the bones as geometries in the
// frame of `root`.
function chain(root, specs, frames) {
  const out = [];
  let at = root.clone();
  specs.forEach((s, i) => {
    at = at.multiply(new THREE.Matrix4().makeTranslation(0, i === 0 ? 0 : specs[i - 1].len, 0)).multiply(frames[i]);
    out.push(bone(s.len, s.r, { tip: i === specs.length - 1, flare: s.flare || 0, ext: s.ext || 0 }).applyMatrix4(at));
  });
  return out;
}

const rotX = (a) => new THREE.Matrix4().makeRotationX(a);
const rotY = (a) => new THREE.Matrix4().makeRotationY(a);
const rotZ = (a) => new THREE.Matrix4().makeRotationZ(a);
const euler = (x, y, z) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z, "XYZ"));
const move = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;

// Four fingers: [x at the knuckle, knuckle height, bone lengths, radius, base splay]
const fingerDefs = [
  { x: -0.3, y: 0.47, lens: [0.37, 0.27, 0.22], r: 0.102, splay: -0.12 }, // index
  { x: -0.1, y: 0.51, lens: [0.41, 0.31, 0.23], r: 0.106, splay: -0.03 }, // middle
  { x: 0.1, y: 0.47, lens: [0.38, 0.29, 0.22], r: 0.1, splay: 0.06 }, // ring
  { x: 0.29, y: 0.39, lens: [0.3, 0.22, 0.19], r: 0.086, splay: 0.17 }, // pinky
];

// The hand in the reference frame (a right hand, back of the hand toward
// +z, fingers up, thumb on the -x side), in a pose: the palm, the fingers
// and the thumb as geometries. The wrist and arm are built separately
// (armPart), so the flex at the wrist can bend them.
function handPieces(curl, spread) {
  const pieces = [];
  // Palm: a flattened ellipsoid carved into a slab
  pieces.push(
    carvedPart(
      V(0, 0.05, 0),
      V(0.5, 0.58, 0.24),
      [
        plane([0, 0, 1], [0, 0, 0.13]), // back of the hand
        plane([0, 0, -1], [0, 0, -0.15]), // palm
        plane([1, 0, 0], [0.37, 0, 0]), // pinky edge, in line with the outside of the pinky
        plane([-1, 0, 0], [-0.395, 0, 0]), // index edge, in line with the outside of the index finger
        plane([1, 0, 1.3], [0.29, 0, 0.1]), // back bevels
        plane([-1, 0, 1.3], [-0.315, 0, 0.1]),
        plane([0, 1, 1.6], [0, 0.47, 0.085]), // back of the hand slopes down into the finger roots
        plane([0, 1, -1.2], [0, 0.5, -0.05]), // palm side slopes up into them too
        plane([0.35, 1, 0], [0.3, 0.47, 0]), // knuckles drop toward the pinky
        plane([0, -1, 0], [0, HEEL, 0]), // wrist cut
        // Heel of the hand: each side eases in toward the wrist through three
        // faces of increasing slope, a faceted curve that lands on the wrist's
        // width at its top
        ...[1, -1].flatMap((sx) => {
          const w = sx > 0 ? 0.37 : 0.395;
          const pts = [
            [w, 0.12],
            [w - 0.035, -0.09],
            [w - 0.1, -0.25],
            [0.218, HEEL],
          ];
          return pts.slice(1).map((p, i) => {
            const [x1, y1] = pts[i],
              [x2, y2] = p;
            return plane([sx * (y1 - y2), -(x1 - x2), 0], [sx * x1, y1, 0]);
          });
        }),
      ],
      [48, 40],
    ),
  );
  // Fingers: knuckles are plain hinges at mid-depth of the hand. Full curl:
  // first segment at 90°, middle at 90°, tip closing just short of the palm,
  // so a fist never pushes a finger through the hand. Outer fingers lead
  // slightly on the way there, but every finger lands on the same limits.
  fingerDefs.forEach((f, i) => {
    const base = move(f.x, f.y, 0.015).multiply(rotZ(-f.splay * (0.4 + 1.6 * spread)));
    const specs = f.lens.map((len, k) => ({ len, r: f.r * (k === 0 ? 0.94 : Math.pow(0.9, k)), flare: k === 0 ? 0.18 : 0, ext: 0 }));
    const t = Math.min(1, curl * (1 + i * 0.06));
    pieces.push(...chain(base, specs, [rotX(-lerp(0.08, Math.PI / 2, t)), rotX(-lerp(0.12, Math.PI / 2, t)), rotX(-lerp(0.08, 0.6, t))]));
  });
  // Thumb: metacarpal (mostly buried in the pad), then two short bones.
  // thumbBase aims the thumb; thumbTwist rolls it on its own axis so the
  // nail faces out and the pad faces the index finger, so its curl closes
  // across the palm.
  const thumbBase = move(-0.3, -0.18, -0.06).multiply(euler(-0.35 - 0.25 * curl, 0, 0.55 + 0.45 * spread - 0.25 * curl));
  const thumbTwist = thumbBase.multiply(rotY(-0.85));
  pieces.push(
    ...chain(
      thumbTwist,
      [
        { len: 0.3, r: 0.13, flare: 0.25 },
        { len: 0.22, r: 0.112, flare: 0.12 },
        { len: 0.19, r: 0.102 },
      ],
      [new THREE.Matrix4(), rotX(-0.12 - 0.5 * curl), rotX(-0.15 - 0.7 * curl)],
    ),
  );
  return pieces;
}

// The wrist, forearm and upper arm as one carved piece, in the reference
// frame: the reference's wrist section (a rounded octagon, pinched where it
// meets the heel of the hand, swelling as it runs down, running up inside
// the palm so there's no seam) carried on at the same rate of swell to the
// elbow, then straight down to the foot. `foot` is how far below the heel
// it ends (reference units).
function armPart(foot) {
  const yTop = HEEL,
    yBot = -1.55; // the reference's stub: its taper is measured over this
  const top = { a: 0.21, b: 0.128 },
    bot = { a: 0.33, b: 0.2 }; // half-width, half-depth at yTop and yBot
  const elbowY = HEEL - FOREARM_BUILT / HAND_SCALE;
  const support = (e, c, sn) => Math.sqrt((e.a * c) ** 2 + (e.b * sn) ** 2);
  const planes = [];
  for (let k = 0; k < 8; k++) {
    const th = (k * Math.PI) / 4,
      c = Math.cos(th),
      sn = Math.sin(th);
    const shave = k % 2 ? 0.93 : 1; // diagonal faces sit a little in, for crisp bevels
    const dt = support(top, c, sn) * shave,
      db = support(bot, c, sn) * shave;
    // From the top down to the elbow the face leans out at the reference's rate...
    const ky = (db - dt) / (yTop - yBot);
    const n = V(c, ky, sn),
      len = n.length();
    planes.push({ n: n.clone().divideScalar(len), d: (dt + ky * yTop) / len });
    // ...and below the elbow it runs straight, at the elbow's width
    const de = dt + ky * (yTop - elbowY);
    planes.push(plane([c, 0, sn], [c * de, 0, sn * de]));
  }
  planes.push(plane([0, -1, 0], [0, HEEL - foot, 0])); // flat cut at the foot
  const topY = 0.1; // how far it runs up inside the palm (the reference's)
  const midY = (topY + (HEEL - foot)) / 2,
    halfY = (topY - (HEEL - foot)) / 2;
  return carvedPart(V(0, midY, 0), V(0.7, halfY + 0.1, 0.45), planes, [40, 128], [8, 48]); // the upper arm keeps enough rings to bend
}

// The flex at the wrist: the hand turns about the hinge at the heel, and
// the top of the arm bends smoothly into it over `zone` below the heel
// (the arm runs up inside the palm, so it must follow the hand there)
function flexWrist(geo, angle, zone = 0.45) {
  if (!angle) return geo;
  const pos = geo.attributes.position,
    nor = geo.attributes.normal;
  const p = V(),
    n = V(),
    q = new THREE.Quaternion(),
    ax = V(1, 0, 0);
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const t = THREE.MathUtils.smoothstep(p.y, HEEL - zone, HEEL);
    if (t <= 0) continue;
    q.setFromAxisAngle(ax, angle * t);
    p.y -= HEEL;
    p.applyQuaternion(q);
    p.y += HEEL;
    pos.setXYZ(i, p.x, p.y, p.z);
    n.fromBufferAttribute(nor, i).applyQuaternion(q);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// A whole arm in a pose, laid out in the neck frame for the neck shaders,
// its axis through (axis.x, axis.z), the neck's own (statues.js RCX, RCZ,
// which the shaders bend about). The elbow sits on the stretch line, the
// heel of the hand FOREARM above it; the hand stands fingers up with its
// palm facing +z, the way the bend folds. The upper arm is the straight
// zone below the elbow, with enough rings to bend. side -1 mirrors the
// whole arm into a left one.
export function buildArm(name = "flat", side = 1, axis = { x: 0, z: 0 }, detail = HANDS.detail, roll = false) {
  const pose = HAND_POSES[name] ?? HAND_POSES.flat;
  detailNow = detail; // every pose at one detail has the same vertices, which the pose blend needs
  // In the reference frame the hand's palm faces -z; the flex folds toward it
  const pieces = handPieces(pose.curl, pose.spread).map((g) => g.applyMatrix4(move(0, HEEL, 0).multiply(rotX(-pose.wrist)).multiply(move(0, -HEEL, 0))));
  pieces.push(flexWrist(armPart((FOREARM_BUILT + 1) / HAND_SCALE), -pose.wrist));
  // Reference frame → arm frame: the heel to the wrist point, scaled, turned
  // round so the palm faces +z
  const toArm = move(axis.x, STRETCH_FROM + FOREARM, axis.z).multiply(new THREE.Matrix4().makeScale(HAND_SCALE, HAND_SCALE, HAND_SCALE)).multiply(rotY(Math.PI)).multiply(move(0, -HEEL, 0));
  const geo = mergeGeometries(pieces.map((g) => clean(g.applyMatrix4(toArm))));
  if (side < 0) {
    // Mirror across x: positions and normals flipped, triangles turned round
    const pos = geo.attributes.position.array,
      nor = geo.attributes.normal.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = -pos[i];
      nor[i] = -nor[i];
    }
    for (let i = 0; i < pos.length; i += 9)
      for (const arr of [pos, nor])
        for (let c = 0; c < 3; c++) {
          const t = arr[i + 3 + c];
          arr[i + 3 + c] = arr[i + 6 + c];
          arr[i + 6 + c] = t;
        }
  }
  // The upper arm as a column (H.column): the stretched part below the
  // elbow (geometry y under STRETCH_FROM) thickened about the arm's axis,
  // full below COLUMN_NECK under the elbow, easing back to the arm's own
  // girth at it. A cylinder thickened about its axis keeps its normals
  if (HANDS.column !== 1) {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const t = THREE.MathUtils.smoothstep(STRETCH_FROM - pos[i + 1], 0, COLUMN_NECK); // 0 at the elbow, 1 a little under it
      if (t <= 0) continue;
      const k = 1 + (HANDS.column - 1) * t;
      pos[i] = axis.x + (pos[i] - axis.x) * k;
      pos[i + 2] = axis.z + (pos[i + 2] - axis.z) * k;
    }
  }
  if (roll) {
    // The wiper arm: turned a quarter about its own axis, so the neck
    // shader's fold (toward +z) swings the forearm to the side of the hand,
    // and the palm faces -x, which the wiper's frame turns to the ground
    const pos = geo.attributes.position.array,
      nor = geo.attributes.normal.array;
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i] - axis.x,
        z = pos[i + 2] - axis.z;
      pos[i] = axis.x - z;
      pos[i + 2] = axis.z + x;
      const nx = nor[i];
      nor[i] = -nor[i + 2];
      nor[i + 2] = nx;
    }
  }
  return geo;
}
