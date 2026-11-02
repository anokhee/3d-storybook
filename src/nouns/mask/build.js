import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { MASK_SHAPE } from "./objects.js";

// BUILDING A MASK onto a face (see MASK in ./objects.js): `lump` the
// figure's body geometry (Anthro's, at size 1), `face` [x, y, z] the front of
// its head, `shape` MASK_SHAPE, `style` one of MASK_STYLES, `colors`
// { mask, ink } the wearer's. Returns `parts`: [{ geometry, color, order,
// double }], each drawn in its own colour — the shell first, then what is
// laid on it.

// Only the triangles round the face, so the rays have little to test.
function faceRegion(geometry, face) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const p = g.attributes.position, keep = [];
  for (let i = 0; i < p.count; i += 3) {
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    if (Math.abs(y - face[1]) < 0.3 && z > face[2] - 0.2)
      for (let k = 0; k < 3; k++) keep.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
  out.computeBoundingSphere();
  return out;
}

// Where a ray straight back at (x, y) lands on the face: the point and its
// normal (or, missing it, the last that hit, facing out).
function caster(region) {
  const target = new THREE.Mesh(region, new THREE.MeshBasicMaterial());
  const ray = new THREE.Raycaster(), from = new THREE.Vector3(), back = new THREE.Vector3(0, 0, -1);
  let last = { at: new THREE.Vector3(), n: new THREE.Vector3(0, 0, 1) };
  return (x, y) => {
    ray.set(from.set(x, y, 2), back);
    const hit = ray.intersectObject(target, false)[0];
    if (hit) last = { at: hit.point.clone(), n: hit.face.normal.clone() };
    else last = { at: last.at.clone().setX(x).setY(y), n: last.n.clone() };
    return last;
  };
}

// A disc of triangles over a ring grid (pts[0] its middle), facing +z or
// (flipped) back.
function capOf(pts, rings, segs, flip) {
  const pos = [], idx = [], index = [];
  pts.forEach((row, i) => { index.push([]); row.forEach((v) => { index[i].push(pos.length / 3); pos.push(v.x, v.y, v.z); }); });
  const tri = (a, b, c) => (flip ? idx.push(a, c, b) : idx.push(a, b, c));
  for (let j = 0; j < segs; j++) tri(index[0][0], index[1][j], index[1][(j + 1) % segs]);
  for (let i = 1; i < rings; i++)
    for (let j = 0; j < segs; j++) {
      const a = index[i][j], b = index[i + 1][j], c = index[i + 1][(j + 1) % segs], d = index[i][(j + 1) % segs];
      tri(a, b, c); tri(a, c, d);
    }
  return { pos, idx };
}
const geometryOf = (pos, idx) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

// ---- outlines, in the face's plane, about the mask's middle --------------
const ellipse = (cx, cy, rx, ry, turn = 0, n = 22) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    return [cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)];
  });
const arc = (cx, cy, rx, ry, a0, a1, n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
// a line `width` wide along `pts` (a number, or one per point: it tapers)
function stroke(pts, width) {
  const w = (i) => (Array.isArray(width) ? width[i] : width) / 2;
  const left = [], right = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    left.push([p[0] - dy * w(i), p[1] + dx * w(i)]);
    right.push([p[0] + dy * w(i), p[1] - dx * w(i)]);
  });
  return [...left, ...right.reverse()];
}
const taper = (n, most) => Array.from({ length: n }, (_, i) => most * Math.sin((Math.PI * (i + 0.5)) / n) + 0.0015);
const starOf = (cx, cy, ro, ri, points = 5, turn = Math.PI / 2) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? ri : ro, a = turn + (i * Math.PI) / points;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const drop = (cx, cy, r) => [...arc(cx, cy, r, r, Math.PI * 1.15, Math.PI * 1.85 + Math.PI * 1.0, 16).slice(0), [cx, cy + r * 2.2]];

// THE MARKINGS a style may wear (`markings`), each a list of outlines about
// the mask's middle, `ex, ey` the eyes:
//   "vertical lines"   a line down through each eye, brow to cheek, and one
//                      down the middle of the forehead
//   "under-eye lines"  two short strokes under each eye, sweeping out
//   "all over"         both, and a chevron on the brow, three stripes on the
//                      chin and a row of dots down each cheek
const vline = (x, y0, y1, w) => { const p = Array.from({ length: 9 }, (_, i) => [x, y0 + ((y1 - y0) * i) / 8]); return stroke(p, taper(p.length, w)); };
const VERTICAL = (ex, ey) => [vline(-ex, 0.115, -0.075, 0.013), vline(ex, 0.115, -0.075, 0.013), vline(0, 0.125, 0.045, 0.01)];
// under each eye, `lines` (1–3, the style's `underEyeLines`) short even
// strokes, stacked down and sweeping out
const UNDER_EYE = (ex, ey, style = {}) => [-1, 1].flatMap((s) => Array.from({ length: Math.max(1, Math.min(3, Math.round(style.underEyeLines ?? 2))) }, (_, k) => {
  const y = ey - 0.026 - k * 0.014;
  return stroke([[s * (ex - 0.022), y], [s * (ex + 0.006), y - 0.003], [s * (ex + 0.034), y - 0.009]], 0.006);
}));
const WHISKERS = () => [-1, 1].flatMap((s) => [-1, 0, 1].map((k) => stroke([[s * 0.05, -0.03 + k * 0.007], [s * 0.104, -0.03 + k * 0.016]], [0.0045, 0.002])));
// THE EYES (a style's `eyes`), each `rx` across and `ry` tall about its
// middle; `tilt` turns its outer corner up (+) or down (−); `almond` draws it
// pointed at the corners rather than oval; `shine` puts a white glint in it
//   round        plain oval holes
//   slit         a thin flat slit
//   tilted up    almonds, outer corners raised (a sly, cat's look)
//   tilted down  almonds, outer corners dropped (a sad, sleepy look)
//   doe          small, soft, nearly round eyes
export const EYES = {
  round: { rx: 0.024, ry: 0.032 },
  slit: { rx: 0.032, ry: 0.006 },
  "tilted up": { rx: 0.03, ry: 0.013, tilt: 0.35, almond: true },
  "tilted down": { rx: 0.03, ry: 0.013, tilt: -0.35, almond: true },
  doe: { rx: 0.022, ry: 0.026 },
};
export const EYE_NAMES = Object.keys(EYES);
// the eye's outline on side `s` (±1, + the viewer's right), `pad` out from
// it, from angle a0 to a1 (0 its outer corner) — in the face's plane
const eyeOutline = (E, cx, cy, s, pad = 0, a0 = 0, a1 = Math.PI * 2, n = 28, closed = true) => {
  const turn = E.tilt ?? 0;
  return Array.from({ length: closed ? n : n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n, sn = Math.sin(a);
    const x = Math.cos(a) * (E.rx + pad), y = (E.almond ? Math.sign(sn) * Math.pow(Math.abs(sn), 1.5) : sn) * (E.ry + pad);
    const u = x * Math.cos(turn) - y * Math.sin(turn), v = x * Math.sin(turn) + y * Math.cos(turn);
    return [cx + s * u, cy + v];
  });
};
const eyeOf = (style) => EYES[style.eyes] ?? EYES.round;

// THE PAINTS: each its own switch (a style's `paints`, a list of these
// names), any of them together, laid on in `markColor` and standing a hair
// proud of the shell (PAINT_THICK), under the eyes, mouth and nose
export const PAINTS = {
  whiskers: WHISKERS,
  vertical: VERTICAL,
  underEye: UNDER_EYE,
  // a filled triangle on the brow, pointing down between the eyes
  // (its sides cut into short steps, so its raised edge bends with the shell)
  brow: () => {
    const c = [[-0.04, 0.104], [0, 0.066], [0.04, 0.104]], n = 8;
    return [c.flatMap((a, i) => { const b = c[(i + 1) % 3]; return Array.from({ length: n }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); })];
  },
  chin: () => [-0.026, 0, 0.026].map((x) => vline(x, -0.088, -0.128, 0.009)),
  // a row of dots down each cheek, and a line down the middle of the
  // forehead and of the chin
  cheekDots: () => [
    ...[-1, 1].flatMap((s) => [0.004, -0.018, -0.04].map((y) => ellipse(s * 0.108, y, 0.0065, 0.0065, 0, 14))),
    vline(0, 0.125, 0.06, 0.01),
    vline(0, -0.088, -0.128, 0.009),
  ],
  // blush: a soft spot on each cheek — not dealt on its own any more, only
  // with the brow chevron (bigger then: BROW_CHEEKS, or the style's `cheekScale`)
  cheeks: (ex, ey, style = {}) => {
    const k = style.cheekScale ?? (paintsOf(style).includes("brow") ? BROW_CHEEKS : 1);
    return [-1, 1].map((s) => ellipse(s * (0.078 + 0.006 * (k - 1)), -0.036 - 0.004 * (k - 1), 0.02 * k, 0.013 * k));
  },
  // eyeliner: a band round each eye (its own shape, `pad` out from it —
  // the eye drawn over its middle leaves the outline), swept out sideways
  // into a point
  flicks: (ex, ey, style = {}) => {
    const E = eyeOf(style), pad = 0.0065, wing = 0.032;
    return [-1, 1].map((s) => {
      // round the eye from just above its outer corner, over the top and back under
      const ring = eyeOutline(E, 0, 0, 1, pad, 0.45, Math.PI * 2 - 0.45, 28, false);
      // the point: straight out sideways from the eye's outer corner, a hair up
      const out = Math.max(...ring.map(([x]) => x)), corner = (ring[0][1] + ring[28][1]) / 2;
      const pts = [...ring, [out + wing, corner + 0.003]];
      return pts.map(([x, y]) => [s * (ex + x), ey + y]);
    });
  },
};
export const PAINT_NAMES = Object.keys(PAINTS);

// THE PATTERNS (a style's `pattern`): a faint second paint, tone on tone —
// the shell's own colour a shade or two deeper (patternColorOf) — laid
// under everything else, flat to the shell but for a whisper of relief. Deco:
//   border    a band round the rim in four arcs, a finer ring inside it
//   beads     a ring of small round beads just in from the rim
//   sunburst  rays fanning up over the forehead from behind the brow
//   swirls    a curl in each corner, winding in, three dots between each pair
//   fans      stacked arcs fanning up from the chin, a shell's ribs
const arcPts = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
export const PATTERNS = {
  border: () => [
    ...[0, 1, 2, 3].map((q) => stroke(arcPts(0, 0, 0.137, q * Math.PI / 2 + 0.06, (q + 1) * Math.PI / 2 - 0.06), 0.007)),
    ...[0, 1].map((h) => stroke(arcPts(0, 0, 0.125, h * Math.PI + 0.03, (h + 1) * Math.PI - 0.03, 40), 0.0022)),
  ],
  beads: () => Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return ellipse(Math.cos(a) * 0.134, Math.sin(a) * 0.134, 0.0055, 0.0055, 0, 12); }),
  sunburst: () => Array.from({ length: 11 }, (_, i) => {
    const a = 0.32 + ((Math.PI - 0.64) * i) / 10, w = 0.045, cx = 0, cy = 0.03, r0 = 0.07, r1 = 0.112;
    return [[cx + Math.cos(a - w * 0.25) * r0, cy + Math.sin(a - w * 0.25) * r0], [cx + Math.cos(a - w / 2) * r1, cy + Math.sin(a - w / 2) * r1], [cx + Math.cos(a + w / 2) * r1, cy + Math.sin(a + w / 2) * r1], [cx + Math.cos(a + w * 0.25) * r0, cy + Math.sin(a + w * 0.25) * r0]];
  }),
  swirls: () => [
    // between each pair of curls, on the same round, three dots — the middle one larger
    ...[0, 1, 2, 3].flatMap((q) => [-0.2, 0, 0.2].map((d) => { const a = (q * Math.PI) / 2 + d, r = d ? 0.0042 : 0.0062; return ellipse(Math.cos(a) * 0.113, Math.sin(a) * 0.113, r, r, 0, 12); })),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => {
      // an Archimedean curl, wound toward the mask's middle
      const cx = sx * 0.08, cy = sy * 0.08, turns = 1.6, n = 40, a0 = Math.atan2(-cy, -cx);
      const p = Array.from({ length: n + 1 }, (_, i) => { const u = i / n, a = a0 - sx * sy * u * turns * Math.PI * 2, r = 0.026 * (1 - u * 0.85); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
      return stroke(p, p.map((_, i) => 0.0055 * (1 - (i / n) * 0.55)));
    }),
  ],
  fans: () => [0.028, 0.044, 0.06].map((r) => stroke(arcPts(0, -0.142, r, 0.28 * Math.PI, 0.72 * Math.PI, 20), 0.0045)),
};
export const PATTERN_NAMES = Object.keys(PATTERNS);
// the pattern's colour: the shell's, `shade` deeper (a shade or two)
export function patternColorOf(shell, shade = 0.09) {
  return "#" + new THREE.Color(shell).offsetHSL(0, 0.04, -shade).getHexString();
}
// THE DECALS' THICKNESS: everything laid on the shell stands proud of it,
// in layers — the pattern lowest, the paint over it, then the eyes, mouth
// and nose (DECAL_THICK) on top, the teeth on the mouth
export const PAINT_THICK = 0.0035;
const PAINT_LIFT = 0.001;
export const DECAL_THICK = 0.0026;
export const PATTERN_THICK = 0.0016;
// the old single `markings` picks, as sets of paints
const MARKINGS = { whiskers: ["whiskers"], "vertical lines": ["vertical"], "under-eye lines": ["underEye"], "all over": ["vertical", "underEye", "brow", "chin", "cheekDots"] };
const paintsOf = (style) => [...new Set([...(style.paints ?? []), ...(MARKINGS[style.markings] ?? []), ...(style.marks === "fox" ? ["flicks"] : []), ...(style.whiskers ? ["whiskers"] : []), ...(style.cheeks ? ["cheeks"] : [])])].flatMap((n) => (n === "brow" ? ["brow", "cheeks"] : [n])).filter((n, i, a) => a.indexOf(n) === i);
// the brow chevron comes with blushed cheeks, in their own colour (the
// style's `cheeks`, else BROW_BLUSH), not the paint's
const BROW_BLUSH = "#F2A9B8";
const BROW_CHEEKS = 1.5;

// What a style draws on the front, as [outline, colour, lift] — `ink` and
// the style's own colours resolved — about the mask's middle, `e` the eyes'
// [across, up].
// The nose's colour, from the shell's: a deeper, richer shade of it (or, on
// a near-white shell, a warm tan), so it sits in the mask as one piece
// every nose drawn this many times its base size (a style's `noseScale` overrides)
export const NOSE_SCALE = 2;
// the horse's and bear's ears drawn this many times their first size
export const EAR_SCALE = 1.45;
// the horse ear's base, this many times its own width
export const HORSE_EAR_BASE = 1.5;
export function noseColorOf(shell) {
  const c = new THREE.Color(shell), chroma = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
  if (chroma < 0.12) return "#" + c.lerp(new THREE.Color("#B07F5E"), 0.92).getHexString();
  return "#" + c.offsetHSL(0, 0.15, -0.3).getHexString();
}

// THE OPEN MOUTH ("toothy"): a dark blob, wider than it is tall, its edge
// wobbling a little, and a row of small white teeth lining its top edge
// pointing down and another along its bottom edge pointing up — about
// (0, `y`), `w` across and `h` tall. `frown`: the same blob turned sulky —
// its top the rounder side, its bottom the flatter, its corners drooping
// `droop` (the teeth follow the edge)
const MOUTH = { y: -0.058, w: 0.066, h: 0.042, top: 5, bottom: 4, tooth: 0.0085, teeth: "#FFF8EA" };
function toothyMouth(add, ink, frown = false, M = MOUTH) {
  const rx = M.w / 2, ry = M.h / 2, droop = frown ? 0.012 : 0;
  // the blob: an ellipse, one side (the top; a frown's bottom) a touch
  // flatter, its sides a touch fuller; a frown's corners pulled down
  const edge = (a) => {
    const wob = 1 + 0.07 * Math.cos(2 * a) + 0.04 * Math.sin(3 * a + 0.6), up = Math.sin(a) > 0;
    const x = Math.cos(a) * rx * wob;
    return [x, M.y + Math.sin(a) * ry * (up !== frown ? 0.85 : 1) * wob - droop * (Math.pow(x / rx, 2) - 0.4)];
  };
  add(Array.from({ length: 32 }, (_, i) => edge((i / 32) * Math.PI * 2)), ink, 0.003);
  // where the edge is at `x`, top or bottom (searched along the outline)
  const at = (x, top) => {
    let best = null;
    for (let i = 0; i <= 200; i++) {
      const a = top ? (i / 200) * Math.PI : Math.PI + (i / 200) * Math.PI, p = edge(a);
      if (!best || Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
    }
    return best;
  };
  // the teeth: little triangles, their bases on the edge (just inside it),
  // spread along the middle of it, pointing into the mouth
  const row = (n, top) => {
    const span = rx * 0.62, w = (span * 2) / n;
    for (let i = 0; i < n; i++) {
      const x = -span + w * (i + 0.5), [ , y] = at(x, top), d = top ? -1 : 1, base = y + d * 0.0012;
      const len = M.tooth * (1 - 0.35 * Math.pow(Math.abs(x) / span, 2)); // shorter toward the corners
      add([[x - w * 0.45, base], [x + w * 0.45, base], [x, base + d * len]], M.teeth, 0.004);
    }
  };
  row(M.top, true);
  row(M.bottom, false);
}

function featuresOf(style, ink, e, base = "#F7F4EE") {
  const out = [], [ex, ey] = e;
  const add = (pts, color, lift = 0.002, raised = DECAL_THICK) => out.push([pts, color, lift, raised]);
  const mark = style.markColor ?? ink;
  // the paints first, behind the eyes: each switched on its own (PAINTS),
  // like a character creator's face paint, raised a hair off the shell but
  // topping out (PAINT_LIFT + PAINT_THICK) below the eyes, mouth and nose
  // (the old `cheeks: <colour>` is the cheeks paint in that colour)
  // the pattern first of all, under the paint: tone on tone, barely raised
  if (style.pattern && PATTERNS[style.pattern]) {
    const pc = style.patternColor ?? patternColorOf(base, style.patternShade);
    for (const pts of PATTERNS[style.pattern]()) add(pts, pc, 0.0004, PATTERN_THICK);
  }
  const painted = paintsOf(style);
  const cheekColor = typeof style.cheeks === "string" ? style.cheeks : painted.includes("brow") ? BROW_BLUSH : mark;
  for (const name of painted) for (const pts of PAINTS[name]?.(ex, ey, style) ?? []) add(pts, name === "cheeks" ? cheekColor : mark, PAINT_LIFT, Math.min(style.paintThick ?? PAINT_THICK, 0.003 + DECAL_THICK - 0.0008 - PAINT_LIFT));
  // the eyes
  for (const s of [-1, 1]) {
    if (style.eyes in EYES || !style.eyes) {
      const E = eyeOf(style);
      add(eyeOutline(E, s * ex, ey, s), ink, 0.003);
      // a doe's glint: a white spot high in each eye, toward the inside
      if (E.shine) add(ellipse(s * (ex - E.rx * 0.3), ey + E.ry * 0.38, 0.0075, 0.0075, 0, 14), "#FFFFFF", 0.0036);
    }
    if (style.eyes === "happy") { const p = arc(s * ex, ey - 0.012, 0.024, 0.022, Math.PI * 0.12, Math.PI * 0.88); add(stroke(p, 0.011), ink, 0.003); }
  }
  // the mouth (no smiles, no tears: those are gone from the designs)
  if (style.mouth === "toothy" || style.mouth === "shark") toothyMouth(add, ink);
  if (style.mouth === "toothy frown") toothyMouth(add, ink, true);
  if (style.mouth === "frown") { const p = arc(0, -0.09, 0.034, 0.022, Math.PI * 0.18, Math.PI * 0.82); add(stroke(p, 0.01), ink, 0.003); }
  // a painted triangle of a nose
  if (style.nose === "cat" || style.nose === "triangle") { const k = style.noseScale ?? NOSE_SCALE, c = -0.0187; add([[-0.011, -0.014], [0.011, -0.014], [0, -0.028]].map(([x, y]) => [x * k, c + (y - c) * k]), style.noseColor ?? noseColorOf(base), 0.003); }
  return out;
}

// THE SHELL depends only on the face and MASK_SHAPE — not on the style — so
// it is built once per face and shape and shared (`shared` on its part: not
// to be disposed with the rest). With it comes `laid(x, y, out)`: the point
// on its front at (x, y) about the mask's middle, `out` further off, read
// straight off the shell's own grid (no rays), and its normal.
const shells = new WeakMap();
function shellOf(lump, face, M) {
  const key = JSON.stringify([face, M]);
  let byKey = shells.get(lump);
  if (!byKey) shells.set(lump, (byKey = new Map()));
  if (byKey.has(key)) return byKey.get(key);
  const R = M.radius, rings = 14, segs = 40;
  const region = faceRegion(lump, face);
  const cast = caster(region);
  const frontOff = (u) => M.lift + M.thick + M.bulge * (1 - u * u);
  // a ring grid shot onto the face
  let grid = [];
  for (let i = 0; i <= rings; i++) {
    const row = [], rho = (i / rings) * R;
    for (let j = 0; j < (i ? segs : 1); j++) {
      const th = (j / segs) * Math.PI * 2;
      const h = cast(face[0] + Math.cos(th) * rho, face[1] + Math.sin(th) * rho);
      row.push({ at: h.at, n: h.n, u: i / rings });
    }
    grid.push(row);
  }
  // smoothed: a mask is rigid — it follows the face's shape, not its every
  // crease — so each sample is eased toward its neighbours, round its ring
  // and across to the next, a few times over (the middle toward the first ring)
  for (let it = 0; it < (M.smooth ?? 8); it++) {
    const next = grid.map((row) => row.map((p) => ({ at: p.at.clone(), n: p.n.clone(), u: p.u })));
    for (let i = 0; i <= rings; i++)
      for (let j = 0; j < grid[i].length; j++) {
        const near = i === 0 ? grid[1] : [grid[i][(j + 1) % segs], grid[i][(j + segs - 1) % segs], i === 1 ? grid[0][0] : grid[i - 1][j], ...(i < rings ? [grid[i + 1][j]] : [])];
        const p = next[i][j];
        p.at.z = p.at.z * 0.4 + (near.reduce((a, q) => a + q.at.z, 0) / near.length) * 0.6;
        p.n.multiplyScalar(0.4).add(near.reduce((a, q) => a.add(q.n), new THREE.Vector3()).multiplyScalar(0.6 / near.length)).normalize();
      }
    grid = next;
  }
  const surface = (off) => grid.map((row) => row.map((p) => p.at.clone().addScaledVector(p.n, off(p.u))));
  const front = surface(frontOff), back = surface(() => M.lift);
  const F = capOf(front, rings, segs, false), B = capOf(back, rings, segs, true);
  const pos = [...F.pos, ...B.pos], idx = [...F.idx, ...B.idx.map((k) => k + F.pos.length / 3)];
  const rim = pos.length / 3;
  front[rings].forEach((v) => pos.push(v.x, v.y, v.z));
  back[rings].forEach((v) => pos.push(v.x, v.y, v.z));
  for (let j = 0; j < segs; j++) {
    const a = rim + j, b = rim + ((j + 1) % segs), c = rim + segs + ((j + 1) % segs), d = rim + segs + j;
    idx.push(a, d, c, a, c, b);
  }
  region.dispose();
  // reading the front off the grid: which ring and spoke (x, y) falls
  // between, the four corners round it blended
  const P = (i, j) => (i === 0 ? front[0][0] : front[i][j]), N = (i, j) => (i === 0 ? grid[0][0].n : grid[i][j].n);
  const blend = (get, i0, i1, j0, j1, ti, tj) => {
    const a = get(i0, j0).clone().lerp(get(i0, j1), tj), b = get(i1, j0).clone().lerp(get(i1, j1), tj);
    return a.lerp(b, ti);
  };
  const laid = (x, y, out) => {
    const r = Math.min(rings, (Math.hypot(x, y) / R) * rings);
    let th = Math.atan2(y, x);
    if (th < 0) th += Math.PI * 2;
    const jf = (th / (Math.PI * 2)) * segs, j0 = Math.floor(jf) % segs, j1 = (j0 + 1) % segs, tj = jf - Math.floor(jf);
    const i0 = Math.floor(r), i1 = Math.min(rings, i0 + 1), ti = r - i0;
    const n = blend(N, i0, i1, j0, j1, ti, tj).normalize();
    return { at: blend(P, i0, i1, j0, j1, ti, tj).addScaledVector(n, out), n };
  };
  const shell = { geometry: geometryOf(pos, idx), laid };
  byKey.set(key, shell);
  return shell;
}

// THE BAND (worn masks only: `band: false` leaves it off, as the prop on
// its own does): a strap round the head holding the mask on — from under
// one side of the mask's rim, round the back of the head, to the other —
// at `y` above the mask's middle, `width` tall, `thick` through, standing
// `off` out from the head. The head's outline at that height is read off
// the lump: every vertex in a thin slice, binned by its angle round the
// head's middle, each bin its farthest, then eased round.
export const BAND = { y: 0.03, width: 0.02, thick: 0.004, off: 0.004 };
function bandOf(lump, face, M, laid, B) {
  const pos = lump.attributes.position, y = face[1] + B.y, slab = 0.012;
  // the head's middle front to back, at that height
  let zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getY(i) - y) < slab && Math.abs(pos.getX(i)) < 0.03) { const z = pos.getZ(i); zMin = Math.min(zMin, z); zMax = Math.max(zMax, z); }
  if (!isFinite(zMin)) return null;
  const cz = (zMin + zMax) / 2, bins = 96, far = new Array(bins).fill(0);
  const angleOf = (x, z) => { let a = Math.atan2(x, z - cz); if (a < 0) a += Math.PI * 2; return a; }; // 0: straight ahead
  for (let i = 0; i < pos.count; i++) {
    const py = pos.getY(i);
    if (Math.abs(py - y) > slab) continue;
    const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z - cz);
    if (r > 0.4) continue; // not the head (a hand, an arm)
    const b = Math.floor((angleOf(x, z) / (Math.PI * 2)) * bins) % bins;
    far[b] = Math.max(far[b], r);
  }
  // empty bins from their neighbours, then eased round a few times
  for (let k = 0; k < bins; k++) if (!far[k]) { let a = 1, b = 1; while (!far[(k - a + bins) % bins] && a < bins) a++; while (!far[(k + b) % bins] && b < bins) b++; far[k] = (far[(k - a + bins) % bins] * b + far[(k + b) % bins] * a) / (a + b); }
  let rad = far;
  for (let it = 0; it < 4; it++) rad = rad.map((r, k) => (rad[(k + bins - 1) % bins] + r * 2 + rad[(k + 1) % bins]) / 4);
  const rAt = (a) => { const f = (a / (Math.PI * 2)) * bins, k = Math.floor(f), t = f - k; return rad[k % bins] * (1 - t) + rad[(k + 1) % bins] * t; };
  // where it goes under the mask: just in from the rim on each side, at its height
  const dy = B.y, rimX = Math.sqrt(Math.max(0, M.radius * M.radius - dy * dy)) * 0.9;
  const ends = [-1, 1].map((s) => laid(s * rimX, dy, -M.thick * 0.5).at);
  const a0 = angleOf(ends[1].x, ends[1].z), a1 = angleOf(ends[0].x, ends[0].z) + (angleOf(ends[0].x, ends[0].z) < a0 ? Math.PI * 2 : 0);
  // its path round the back, right to left, eased out of the two ends
  const n = 64, path = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + (a1 - a0) * u, r = rAt(a % (Math.PI * 2)) + B.off + B.thick / 2;
    const p = new THREE.Vector3(Math.sin(a) * r, y, cz + Math.cos(a) * r);
    const e = Math.min(1, Math.min(u, 1 - u) * n / 4); // the last few steps blended onto the ends
    path.push(e < 1 ? (u < 0.5 ? ends[1] : ends[0]).clone().lerp(p, e) : p);
  }
  // a flat strap: four faces round it (out, in, top, bottom)
  const vs = [], idx = [], hw = B.width / 2, ht = B.thick / 2;
  path.forEach((p) => {
    const out = new THREE.Vector3(p.x, 0, p.z - cz).normalize();
    for (const [o, h] of [[ht, hw], [ht, -hw], [-ht, -hw], [-ht, hw]]) vs.push(p.x + out.x * o, p.y + h, p.z + out.z * o);
  });
  for (let i = 0; i < n; i++)
    for (let f = 0; f < 4; f++) {
      const a = i * 4 + f, b = i * 4 + ((f + 1) % 4), c = (i + 1) * 4 + ((f + 1) % 4), d = (i + 1) * 4 + f;
      idx.push(a, b, c, a, c, d);
    }
  return geometryOf(vs, idx);
}

export function buildMask(lump, face, shape = MASK_SHAPE, style = {}, colors = { mask: "#F7F4EE", ink: "#1A1620" }) {
  const M = { ...MASK_SHAPE, ...shape }, R = M.radius;
  const base = style.color ?? colors.mask, ink = style.ink ?? colors.ink;
  const shell = shellOf(lump, face, M), laid = shell.laid;
  const parts = [{ geometry: shell.geometry, color: base, order: 0, double: true, shared: true }];
  if (style.band !== false) {
    const g = bandOf(lump, face, M, laid, { ...BAND, ...style.bandShape });
    if (g) { g.computeVertexNormals(); parts.push({ geometry: g, color: style.bandColor ?? patternColorOf(base, 0.2), order: 0, double: true }); }
  }

  // WHAT IS LAID ON IT: each outline triangulated flat, then every corner
  // shot onto the face and set out on the shell's front
  // (each triangle split in four, three times over, so it bends with the shell)
  for (const [outline, color, lift, raised] of featuresOf(style, ink, M.eyeAt, base)) {
    const contour = outline.map(([x, y]) => new THREE.Vector2(x, y));
    if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
    let tris = THREE.ShapeUtils.triangulateShape(contour, []).map((t) => t.map((k) => contour[k].clone()));
    for (let level = 0; level < 3; level++)
      tris = tris.flatMap(([a, b, c]) => {
        const ab = a.clone().add(b).multiplyScalar(0.5), bc = b.clone().add(c).multiplyScalar(0.5), ca = c.clone().add(a).multiplyScalar(0.5);
        return [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]];
      });
    const p = [], idx2 = [];
    tris.forEach((t) => t.forEach((v) => { const q = laid(v.x, v.y, lift + raised).at; idx2.push(p.length / 3); p.push(q.x, q.y, q.z); }));
    // raised (the paints): its edge walled down to the shell, so it stands proud
    if (raised > 0) {
      const n = contour.length;
      for (let k = 0; k < n; k++) {
        const a = contour[k], b = contour[(k + 1) % n];
        const a0 = laid(a.x, a.y, lift - 0.0006).at, b0 = laid(b.x, b.y, lift - 0.0006).at, a1 = laid(a.x, a.y, lift + raised).at, b1 = laid(b.x, b.y, lift + raised).at;
        for (const q of [a0, b0, b1, a0, b1, a1]) { idx2.push(p.length / 3); p.push(q.x, q.y, q.z); }
      }
    }
    parts.push({ geometry: geometryOf(p, idx2), color, order: 1 + lift * 100, ...(raised > 0 ? { double: true } : {}) });
  }

  // TENDRILS (`tendrils`: how many a side, 1–3 — `true` is 3; ears
  // "tendrils" or "gills" the old ways): smooth stalks out of each side of
  // the rim, fanning out and sweeping up, each a tube wide at its root and
  // tapering to a soft, rounded tip — in `tendrilColor`, else a deeper shade
  // of the shell, like the nose. The middle one (or the middle pair, with
  // two) sits halfway down the face, the others above and below it.
  const tendrils = style.tendrils === true || style.ears === "tendrils" || style.ears === "gills" || style.gills ? 3 : Math.max(0, Math.min(3, Math.round(+style.tendrils || 0)));
  if (tendrils) {
    const G = { length: 0.11, root: 0.024, tip: 0.0075, flare: 1.25, spread: 0.42, ...(style.tendrilShape ?? style.gillShape) };
    const color = style.tendrilColor ?? style.gillColor ?? noseColorOf(base), pieces = [];
    const UP = new THREE.Vector3(0, 1, 0);
    // [angle round the rim from the side (0: halfway down), length]
    const spots = { 1: [[0, 1]], 2: [[G.spread / 2, 0.95], [-G.spread / 2, 0.95]], 3: [[G.spread, 0.88], [0, 1], [-G.spread, 0.85]] }[tendrils];
    for (const s of [-1, 1])
      for (const [th, len] of spots) {
        const { at } = laid(s * Math.cos(th) * R * 0.9, Math.sin(th) * R * 0.9, -M.thick / 2);
        const out = new THREE.Vector3(s * Math.cos(th), Math.sin(th), -0.3).normalize(), L = G.length * len;
        const curve = new THREE.CatmullRomCurve3([
          at.clone().addScaledVector(out, -0.01),
          at.clone().addScaledVector(out, L * 0.35),
          at.clone().addScaledVector(out, L * 0.7).addScaledVector(UP, L * 0.1),
          at.clone().addScaledVector(out, L).addScaledVector(UP, L * 0.26),
        ]);
        pieces.push(hornOf(curve, G.root, G.tip, 20, 12, 6, G.flare));
      }
    const all = mergeGeometries(pieces.map((g) => (g.index ? g.toNonIndexed() : g)));
    pieces.forEach((g) => g.dispose());
    all.computeVertexNormals();
    parts.push({ geometry: all, color, order: 0, double: true });
  }

  // EARS, standing up from the rim either side of the top, in the shell's
  // colour with their insides a deeper shade of it (as the nose):
  //   "horse"  the zebra's (../goat/Goat.jsx, a zebra's `ears.point`): a
  //            capsule drawn out to a soft point, flattened front to back,
  //            standing up and leaning out a little
  //   "bear"   the bear's (../bear/Bear.jsx): a ball, flattened, sat half
  //            sunk on the rim
  const inner = noseColorOf(base);
  const earFrame = (th, sink, lean = 0) => {
    const { at, n } = laid(Math.cos(th) * R * 0.86, Math.sin(th) * R * 0.86, -sink);
    // up it: outward from the mask's middle, along the face, leaned out by `lean`
    const out = new THREE.Vector3(Math.cos(th + lean), Math.sin(th + lean), -0.25).normalize();
    const yAx = out.clone().addScaledVector(n, -out.dot(n)).normalize();
    const zAx = n.clone().normalize(), xAx = new THREE.Vector3().crossVectors(yAx, zAx);
    return new THREE.Matrix4().makeBasis(xAx, yAx, zAx).setPosition(at);
  };
  if (style.ears === "horse") {
    // the zebra's ear profile (Goat.jsx's earShape, `point` 0.6), at the mask's size
    const ER = 0.019 * EAR_SCALE, EL = 0.05 * EAR_SCALE, P = 0.6, TIP = 0.35;
    const h = EL / 2 + ER, profile = [];
    for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + (k / 6) * (Math.PI / 2); profile.push(new THREE.Vector2(ER * Math.cos(a), -h + ER + ER * Math.sin(a))); }
    const tip = h + ER * TIP * P;
    for (let k = 1; k <= 10; k++) { const u = k / 10; profile.push(new THREE.Vector2(ER * ((1 - P) * Math.sqrt(1 - u * u) + P * (1 - u * u)), u * tip)); }
    // a wider base: the ear swelled out toward its root (HORSE_EAR_BASE times
    // at the bottom), easing back to its own width by the tip
    for (const v of profile) v.x *= 1 + (HORSE_EAR_BASE - 1) * Math.pow(Math.min(1, Math.max(0, (tip - v.y) / (tip + h))), 1.3);
    for (const s of [-1, 1]) {
      const frame = earFrame(Math.PI / 2 - s * 0.6, 0.004 * EAR_SCALE, -s * 0.25);
      const ear = new THREE.LatheGeometry(profile, 16).translate(0, h - 0.006, 0).scale(1, 1, 0.45).applyMatrix4(frame);
      ear.deleteAttribute("uv"); ear.computeVertexNormals();
      parts.push({ geometry: ear, color: base, order: 0, double: true });
      // its inside: the same shape, smaller, just proud of the ear's front
      const in_ = new THREE.LatheGeometry(profile, 16).scale(0.55, 0.72, 0.12).translate(0, h * 0.8, ER * 0.42).applyMatrix4(frame);
      in_.deleteAttribute("uv"); in_.computeVertexNormals();
      parts.push({ geometry: in_, color: inner, order: 0.5, double: true });
    }
  }
  if (style.ears === "bear") {
    const ER = 0.03 * EAR_SCALE;
    for (const s of [-1, 1]) {
      const frame = earFrame(Math.PI / 2 - s * 0.72, 0.006 * EAR_SCALE);
      const ear = new THREE.SphereGeometry(ER, 18, 12).scale(1, 0.85, 0.5).translate(0, ER * 0.55, 0).applyMatrix4(frame);
      ear.deleteAttribute("uv"); ear.computeVertexNormals();
      parts.push({ geometry: ear, color: base, order: 0, double: true });
      const in_ = new THREE.SphereGeometry(ER * 0.58, 16, 10).scale(1, 0.85, 0.25).translate(0, ER * 0.62, ER * 0.24).applyMatrix4(frame);
      in_.deleteAttribute("uv"); in_.computeVertexNormals();
      parts.push({ geometry: in_, color: inner, order: 0.5, double: true });
    }
  }
  // THE DOLLY'S NOSE ("cone"; see makeNoseGeo in
  // ../../renderGrid/buildOneDolly.js): a lathe-turned cone, tapering to
  // `scrunch` of its base and rounded over at the tip by `bulbosity`,
  // standing straight out of the face on the shell's normal, its base sunk a
  // hair under the shell's front
  const NS = style.noseScale ?? NOSE_SCALE;
  if (style.nose === "cone") {
    const N = { x: 0, y: -0.012, radius: 0.013, length: 0.026, scrunch: 0.5, bulbosity: 0.6, ...style.noseShape };
    const k = 2 + (1 - N.bulbosity) * 10, pts = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, t = 1 + (N.scrunch - 1) * u;
      pts.push(new THREE.Vector2(Math.max(0, t * Math.pow(1 - Math.pow(u, k), 1 / k)), u));
    }
    const { at, n } = laid(N.x, N.y, -0.002 * NS);
    const g = new THREE.LatheGeometry(pts, 20).scale(N.radius * NS, N.length * NS, N.radius * NS)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)).translate(at.x, at.y, at.z);
    g.deleteAttribute("uv");
    g.computeVertexNormals();
    parts.push({ geometry: g, color: style.noseColor ?? noseColorOf(base), order: 0, double: true });
  }
  // A BUTTON NOSE ("button"): a little round bead, half sunk in the shell
  if (style.nose === "button") {
    const { at, n } = laid(0, -0.014, -0.004 * NS);
    const g = new THREE.SphereGeometry(0.014 * NS, 18, 12).scale(1.15, 0.9, 0.85)
      .applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)).translate(at.x, at.y, at.z);
    g.deleteAttribute("uv"); g.computeVertexNormals();
    parts.push({ geometry: g, color: style.noseColor ?? noseColorOf(base), order: 0, double: true });
  }
  // A SNOUT ("snout"): a pig's — a short flat-ended disc standing out of the
  // face, two nostrils in its end in the ink
  if (style.nose === "snout") {
    const { at, n } = laid(0, -0.016, -0.003 * NS);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), D = 0.016 * NS;
    const g = new THREE.CylinderGeometry(0.021 * NS, 0.023 * NS, D, 24).scale(1.2, 1, 0.85).translate(0, D / 2, 0).applyQuaternion(q).translate(at.x, at.y, at.z);
    g.deleteAttribute("uv"); g.computeVertexNormals();
    parts.push({ geometry: g, color: style.noseColor ?? noseColorOf(base), order: 0, double: true });
    const nostril = new THREE.SphereGeometry(0.0055 * NS, 10, 8).scale(0.8, 0.35, 1.2);
    nostril.deleteAttribute("uv");
    for (const s of [-1, 1]) {
      const h = nostril.clone().translate(s * 0.009 * NS, D + 0.0003, 0).applyQuaternion(q).translate(at.x, at.y, at.z);
      h.computeVertexNormals();
      parts.push({ geometry: h, color: ink, order: 0.5 });
    }
    nostril.dispose();
  }

  // HORNS, by `type`, each the shape of that animal's own (see HORN_TYPES):
  // rooted on the shell's front on a flat base, its first stretch straight
  // out of the forehead — perpendicular to it (`tilt` leans it over toward
  // the side) — then away along the type's curve to a blunt tip; `radius`
  // thick at the base (times the type's `thick`), `tip` of that at the tip,
  // and `length` its size. A pair rooted at (±x, y), but for the rhino's one
  // horn and the elephant's tusks, rooted where the type says. `show: false`
  // takes them off.
  if (style.horns && style.horns.show !== false) {
    const H = style.horns, T = HORN_TYPES[H.type] ?? HORN_TYPES.buffalo;
    for (const sgn of T.single ? [1] : [-1, 1]) {
      const [rx, ry] = T.root ? T.root(H) : [H.x, H.y];
      const { at, n } = laid(sgn * rx, ry, 0); // rooted on the shell's front
      // its frame: `out` of the forehead, `side` away from the mask's middle
      // along the forehead, and `up`
      const side0 = new THREE.Vector3(sgn, 0, 0).addScaledVector(n, -sgn * n.x).normalize();
      const tilt = H.tilt ?? 0;
      const out = n.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(side0, Math.sin(tilt)).normalize();
      const side = side0.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(n, -Math.sin(tilt)).normalize();
      const up = new THREE.Vector3(0, 1, 0).addScaledVector(out, -out.y).addScaledVector(side, -side.y).normalize();
      // the type's curve, in units of `length`: [out, side, up]
      const L = H.length * (T.size ?? 1);
      const P = ([o, s, u]) => at.clone().addScaledVector(out, o * L).addScaledVector(side, s * L).addScaledVector(up, u * L);
      const curve = new THREE.CatmullRomCurve3(T.points.map(P));
      const r0 = H.radius * (T.thick ?? 1), r1 = r0 * (T.tip ?? H.tip ?? 0.53);
      parts.push({ geometry: hornOf(curve, r0, r1, 32, 20, 6, T.flare ?? 1), color: H.color ?? base, order: 0, double: true });
      // a giraffe's ossicone ends in a dark ball
      if (T.knob) {
        const ball = new THREE.SphereGeometry(r0 * T.knob, 14, 10);
        ball.deleteAttribute("uv");
        const end = curve.getPointAt(1);
        ball.translate(end.x, end.y, end.z);
        parts.push({ geometry: ball, color: H.knobColor ?? ink, order: 0 });
      }
    }
  }
  return { parts };
}

// The horn types, each that animal's own shape fitted to a mask: `points`
// the curve, [out of the forehead, out to the side, up], in units of the
// horn's `length` (times `size`); `thick` the base over the knob's radius,
// `tip` the tip's share of the base (else the knob's); `single` one horn,
// not a pair; `root` where it is rooted ([across, up] from the mask's
// middle) if not the knobs' (±x, y); `knob` a ball on its end, that many
// times the base's radius, in the ink colour (or `knobColor`).
const RAM_SPIRAL = (() => {
  // a ram's (../sheep/Sheep.jsx): up out of the forehead, winding out over
  // the side, down and round under, shrinking as it goes, coming forward
  // to a tip beside the cheek
  const R = 0.42, pts = [[-0.04, 0, 0], [0.12, 0, 0.02]];
  for (let k = 1; k <= 12; k++) {
    const u = k / 12, a = u * 1.7 * Math.PI, r = R * (1 - 0.45 * u);
    pts.push([0.12 + 0.4 * u, R - r * Math.cos(a), 0.02 + r * Math.sin(a)]);
  }
  return pts;
})();
export const HORN_TYPES = {
  // out sideways rising a little, up, and its tip curled back in (../buffalo/Buffalo.jsx)
  // wide at the base, thinning fast (`flare`) to a fine point
  buffalo: { points: [[-0.04, 0, 0], [0.22, 0, 0.01], [0.42, 0.3, 0.08], [0.46, 0.62, 0.45], [0.38, 0.42, 0.95]], thick: 1.55, tip: 0.1, flare: 1.8 },
  ram: { points: RAM_SPIRAL, thick: 1.25, tip: 0.4 },
  // a giraffe's ossicones (../goat/Goat.jsx): short pegs, nearly straight up, a dark ball on each
  giraffe: { points: [[-0.04, 0, 0], [0.15, 0.03, 0.1], [0.22, 0.08, 0.5], [0.24, 0.1, 0.75]], thick: 0.8, tip: 0.85, knob: 1.5, root: (H) => [H.x, H.y + 0.01] },
  // a rhino's (../buffalo/Buffalo.jsx, the nose horn): one, thick, between
  // the eyes, out and up and sweeping back to a point
  rhino: { single: true, points: [[-0.04, 0, 0], [0.3, 0, 0.08], [0.55, 0, 0.4], [0.55, 0, 0.8], [0.42, 0, 1.1]], thick: 1.6, tip: 0.22, size: 1.1, root: (H) => [0, H.y * 0.35] },
  // an elephant's tusks (../buffalo/Buffalo.jsx): out of the lower face
  // either side of the mouth, forward and down, the tips turning up
  elephant: { points: [[-0.04, 0, 0], [0.3, 0.06, -0.2], [0.7, 0.12, -0.42], [1.05, 0.14, -0.38], [1.25, 0.12, -0.12]], thick: 1.2, tip: 0.35, size: 1.2, root: (H) => [H.x + 0.01, -0.06] },
};
export const HORN_TYPE_NAMES = Object.keys(HORN_TYPES);

// A horn: a tube swept along `curve`, tapering from `r0` to `r1` — evenly,
// or with `flare` > 1 wide at the root and thinning fast, (1 - t)^flare —
// closed flat at its base and rounded over at its tip (as a capsule's end).
function hornOf(curve, r0, r1, along = 32, round = 20, tipRings = 6, flare = 1) {
  const { tangents, normals, binormals } = curve.computeFrenetFrames(along, false);
  const pos = [], idx = [], c = new THREE.Vector3();
  const ring = (center, N, B, r) => {
    for (let j = 0; j < round; j++) {
      const a = (j / round) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(center.x + (N.x * ca + B.x * sa) * r, center.y + (N.y * ca + B.y * sa) * r, center.z + (N.z * ca + B.z * sa) * r);
    }
  };
  for (let i = 0; i <= along; i++) ring(curve.getPointAt(i / along, c), normals[i], binormals[i], r1 + (r0 - r1) * Math.pow(1 - i / along, flare));
  // the tip: rings closing over in a quarter circle past the end
  const end = curve.getPointAt(1), T = tangents[along];
  for (let k = 1; k <= tipRings; k++) {
    const phi = (k / tipRings) * (Math.PI / 2);
    ring(end.clone().addScaledVector(T, r1 * Math.sin(phi)), normals[along], binormals[along], Math.max(1e-5, r1 * Math.cos(phi)));
  }
  const rings = along + 1 + tipRings;
  for (let i = 0; i < rings - 1; i++)
    for (let j = 0; j < round; j++) {
      const a = i * round + j, b = i * round + ((j + 1) % round), c2 = (i + 1) * round + ((j + 1) % round), d = (i + 1) * round + j;
      idx.push(a, b, c2, a, c2, d);
    }
  // the flat base: a fan over the first ring
  const mid = pos.length / 3, b0 = curve.getPointAt(0);
  pos.push(b0.x, b0.y, b0.z);
  for (let j = 0; j < round; j++) idx.push(mid, (j + 1) % round, j);
  return geometryOf(pos, idx);
}
