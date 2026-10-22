import * as THREE from "three";

import { smoothGeo, smoothstep } from "../renderGrid/utils.js";
import { bumpAt } from "../presets/materials/textures.js";
import { BANDS } from "../presets/index.js";

// How far the mouth's bow is allowed to run. `bow` is a slope against the
// mouth's WIDTH, but the lip is only as tall as its HEIGHT — so on a wide thin
// mouth an honoured slope lifts the corners several lip-heights and the thing
// stops being a curved lip and becomes a chevron. Past this it is clamped.
const MOUTH_BOW_CAP = 0.55;

// The clamped bow, in local-square units: how far bend() throws the corner of
// a lip above its middle. Two places need it and they have to agree — the geo
// builds the curve, cheekPlacement() reads where that curve left the corner —
// and when they disagree the cheeks chase a corner the lip never reaches. So
// it lives here rather than being written out at both call sites.
const mouthRise = ({ bow, width, height }) =>
  Math.max(
    -MOUTH_BOW_CAP,
    Math.min(MOUTH_BOW_CAP, (bow * width) / (2 * height)),
  );

// The split-model deformer: one boundary, two masses, blended parameters.
// Split in two: the SILHOUETTE (balloon, pinch, shift) and the texture bump on
// top of it. The bump needs to know the silhouette's true normal — see
// deformWith() — so the silhouette has to be callable on its own.
//
// Returns `thin`, the local ring-radius factor the silhouette applied, which
// deformWith() uses to keep the bump proportional to the local girth.
function deformBase(cfg, v, normal) {
  const half = cfg.feather / 2;
  const tw = smoothstep(cfg.split - half, cfg.split + half, v.y);
  const bw = 1 - tw;
  const balloon = cfg.top.balloon * tw + cfg.bottom.balloon * bw;
  v.addScaledVector(normal, balloon);

  // Sharpen the pole. A sphere's radius runs (1 - y^2)^0.5, and that exponent
  // of a half IS the dome: it meets the axis with a horizontal tangent, so the
  // end rounds off however far `balloon` deflates it. Multiplying the ring
  // radius by (1 - y^2)^(point/2) raises the exponent — at point 1 the profile
  // goes linear in the distance to the pole, which is a cone, and past that it
  // curves inside the cone into a needle.
  //
  // Read at the ORIGINAL latitude, not v.y, which `balloon` has already moved.
  // Weighted by y^2 as well, which fades the whole thing out toward the
  // equator: the exponent still arrives at `point` by the time it reaches the
  // pole, so the tip closes exactly the same, but the middle of the silhouette
  // keeps twice as much of its width as it does without the ramp — 2% rather
  // than 6% on the carrot. That is the difference between a knob that sharpens
  // a tip and one that quietly reshapes the whole head.
  //
  // It only ever narrows, so it is clamped at zero; for a blunter end, deflate
  // the balloon instead.
  const point = Math.max(0, cfg.top.point * tw + cfg.bottom.point * bw);
  let squeeze = 1;
  if (point > 0) {
    const y2 = normal.y * normal.y;
    squeeze = Math.pow(Math.max(0, 1 - y2), (point * y2) / 2);
    v.x *= squeeze;
    v.z *= squeeze;
  }

  v.y += cfg.top.shift * tw + cfg.bottom.shift * bw;

  return Math.min(1, Math.max(0, 1 + balloon) * squeeze);
}

// Scratch space for the finite-difference normal. deformWith() is never
// re-entered, so module-level temps are safe and save three allocations per
// vertex per rebuild.
const _dnT1 = new THREE.Vector3();
const _dnT2 = new THREE.Vector3();
const _dnA = new THREE.Vector3();
const _dnB = new THREE.Vector3();
const _dnC = new THREE.Vector3();
const _dnN = new THREE.Vector3();
const _DN_EPS = 1e-3;

// The deformed silhouette's own normal at `normal`, by finite differences:
// deform the point and two tangent-offset neighbors on the sphere and cross
// the edges. The center is deformed from `normal` itself rather than reusing
// the vertex — the vertex rides a jittered lattice, and an offset that size
// under edges this short would point the cross product anywhere. Falls back
// to the sphere normal where the patch degenerates (a needle tip squeezed to
// the axis has nothing to cross).
function deformedNormal(cfg, normal) {
  // Any axis not parallel with `normal` seeds the tangent frame.
  _dnT1.set(1, 0, 0);
  if (Math.abs(normal.x) > 0.9) _dnT1.set(0, 1, 0);
  _dnT1.crossVectors(normal, _dnT1).normalize();
  _dnT2.crossVectors(normal, _dnT1);

  _dnA.copy(normal).addScaledVector(_dnT1, _DN_EPS).normalize();
  _dnB.copy(normal).addScaledVector(_dnT2, _DN_EPS).normalize();
  // Each point IS its own normal — these are unit-sphere points.
  deformBase(cfg, _dnA, _dnN.copy(_dnA));
  deformBase(cfg, _dnB, _dnN.copy(_dnB));
  deformBase(cfg, _dnC.copy(normal), normal);
  _dnA.sub(_dnC);
  _dnB.sub(_dnC);
  _dnN.crossVectors(_dnA, _dnB);
  if (_dnN.lengthSq() < 1e-12) return normal;
  _dnN.normalize();
  // Keep it pointing OUT. The tangent frame's handedness flips with the seed
  // axis, and a sheared patch can genuinely fold; either way the bump should
  // stand off the head, not tunnel into it.
  if (_dnN.dot(normal) < 0) _dnN.negate();
  return _dnN;
}

// A floor for y that rounds over instead of creasing: above `floor + r` the
// value passes through untouched, below it the curve eases exponentially onto
// the floor — C1 where the two meet, monotonic all the way down, and never
// quite touching the floor itself, which is what keeps the icosahedron's
// coarse pole triangles from folding into a hard visible edge. Applied ONCE,
// after the bump — it is not idempotent (a second pass would lift the flat
// region by ~0.37r), so it cannot live in deformBase, which the
// finite-difference normal calls three times per vertex.
function softFloor(y, floor, r) {
  const t = y - floor;
  if (t >= r) return y;
  if (r <= 0) return Math.max(y, floor);
  return floor + r * Math.exp(t / r - 1);
}

function deformWith(cfg, v, normal) {
  const thin = deformBase(cfg, v, normal);

  // The texture, last, so it stands off whatever silhouette deformBase()
  // produced rather than being scaled and sheared by it.
  //
  // Scaled DOWN by `thin` where the silhouette has narrowed: the balloon
  // moves every point along its normal, so a ring's radius scales by exactly
  // (1 + balloon), and `squeeze` is the pinch's own ring-radius factor. Full-
  // amplitude lumps on a tip that thin read as mush, so the bump keeps a
  // constant size relative to the LOCAL girth rather than the original
  // sphere's. Clamped at 1 — a puffed-out head gets its texture as tuned, not
  // amplified.
  //
  // And displaced along the DEFORMED surface's normal, not the sphere's. On a
  // strongly stretched head (the carrot's pullUp shears its whole flank) the
  // two point in very different directions, and a bump ridden out along the
  // sphere normal is mostly TANGENT to the real surface — it slides crowded
  // vertex rows into each other instead of standing lumps off the skin.
  const bump = bumpAt(cfg.bump, normal.x, normal.y, normal.z) * thin;
  if (bump !== 0) v.addScaledVector(deformedNormal(cfg, normal), bump);

  // The chin plane, last of all: after the bump, or the lumps would poke
  // back through the cut. The mesh's own shading is recomputed from the
  // moved triangles (applyMesh calls computeVertexNormals), so flattening
  // positions alone is enough.
  //
  // The TUCK is what keeps the cut from reading as a mushroom cap: clamp y
  // alone and the head carries its full width down to the plane, meeting it
  // in a flared rim. Pulling the ring radius in through the blend zone —
  // nothing at the top of the ease, `tuck` at the plane — turns the rim
  // into a jaw. Read off the PRE-clamp y, which still knows how deep below
  // the plane this vertex wanted to go.
  const chin = cfg.bottom.chin;
  if (chin) {
    const start = chin.y + chin.soft;
    if (v.y < start) {
      const d = Math.min(1, (start - v.y) / (2 * chin.soft));
      const k = 1 - chin.tuck * d * d * (3 - 2 * d);
      v.x *= k;
      v.z *= k;
    }
    v.y = softFloor(v.y, chin.y, chin.soft);
  }
  return v;
}

// ============================================================ shared geometry
// The ear's outer edge as a curve through PAIRS of points: the bottom and
// top attachment points (fixed at the head), and bulge pairs that slide
// along the segment from each attachment point toward the shape's own
// midpoint — the old single-bulge location, pulled out along x by
// `extrusion`. `pointiness` is the lerp fraction along that segment: at 0,
// every bulge pair sits on the attachment points, so the outline is a flat,
// even edge with no bulge at all; at 1 the last pair lands on the midpoint,
// concentrating into the old single sharp bulge; at 0.5 it sits halfway.
// `pointSets` is how many pairs the spline runs through in total: 2 is the
// original four-point curve (base pair + one bulge pair). More sets sample
// the extra pairs off the cubic Bézier that uses the bulge pair as HANDLES
// — not off the straight chord from base to tip, which reads as a wedge
// with a squared-off point, because a spline through collinear points just
// hugs the line. On the Bézier the outline comes out as one smooth arc,
// slimmer than the 2-set spline (a handle pulls a curve without being on
// it). Anything below 2 clamps to 2 — one pair can't curve. The straight
// edge closing back to the start is the flap's flat attachment to the head.
function earGeometry(pointiness, extrusion, pointSets = 2) {
  const sets = Math.max(2, Math.round(pointSets) || 2);
  const p1 = new THREE.Vector2(0, -1);
  const p4 = new THREE.Vector2(0, 1);
  const mid = new THREE.Vector2(1 + extrusion, 0);
  const p2 = p1.clone().lerp(mid, pointiness);
  const p3 = p4.clone().lerp(mid, pointiness);
  const pts =
    sets === 2 ?
      [p1, p2, p3, p4]
    : new THREE.CubicBezierCurve(p1, p2, p3, p4).getPoints(2 * sets - 1);
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.splineThru(pts);
  shape.lineTo(0, -1);
  const g = smoothGeo(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: false,
      curveSegments: 8,
    }),
  );
  g.translate(0, -1, -0.06);
  return g;
}

const EYE_GEO = (() => {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const t = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(t), Math.sin(t))); // protrude = 1
  }
  const g = smoothGeo(new THREE.LatheGeometry(pts, 12));
  g.rotateX(Math.PI / 2);
  return g;
})();

// The face bands for one head. Merged per feature, so a preset states only the
// keys it wants different and inherits the rest — which also means a new param
// added to faceDefaults reaches all eight without editing eight places.
//
// Every feature keeps its full key set either way, so the number of draws is
// the same whichever head is dealt: one seed stays comparable across presets.
function faceBands(headKey) {
  const d = BANDS.faceDefaults;
  const own = BANDS.heads[headKey].face ?? {};
  const out = {};
  for (const part of Object.keys(d)) out[part] = { ...d[part], ...own[part] };
  return out;
}

export { MOUTH_BOW_CAP, mouthRise, deformWith, earGeometry, EYE_GEO, faceBands };
