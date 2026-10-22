import * as THREE from "three";

import { smoothGeo, nNoise } from "../renderGrid/utils.js";
import { bumpAt } from "../presets/materials/textures.js";
import { BALL_GEO, STALKS, beadRadius } from "./limbs.js";

// A dead-straight tube instead of a barrel: flat ends, no rounding, and a
// bottom radius of 1 opening or closing to `top` at the far end. Stacked up a
// rope it reads as one unbroken cone rather than a string of beads, which is
// what a mushroom stalk wants.
//
// The two radii are what make the chain seamless. A barrel hides the joins in
// its own rounded ends, so drawRope() can just scale each segment uniformly
// and let neighbors differ; butt two flat-ended tubes of different widths
// together and the step is a visible collar. So a tube's top radius is the
// NEXT segment's bottom radius, exactly — which forces the radius down the
// rope to be geometric (r_i = radius * top^i) rather than the linear ramp a
// barrel uses. drawRope() knows about both laws.
function tubeGeometry(top, curve) {
  const t = Math.max(1e-4, top);
  // r(u) = t + (1 - t) * (1 - u)^p runs from 1 at the base to exactly t at the
  // top whatever p is — so `curve` bends the WAY it gets there without ever
  // moving either end. p = 1 is the straight frustum; above 1 the radius drops
  // away early and then holds, which is the thick-footed, thin-necked taper a
  // turned antenna has; below 1 it stays fat and closes late.
  const p = curve >= 0 ? 1 + curve * 2 : 1 / (1 - curve * 2);
  // A straight profile needs two points and no more. Only pay for the
  // subdivision when there is a curve to resolve.
  const N = p === 1 ? 1 : 10;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(new THREE.Vector2(t + (1 - t) * Math.pow(1 - u, p), u));
  }
  const g = smoothGeo(new THREE.LatheGeometry(pts, 12));
  g.rotateX(Math.PI / 2);
  return g;
}

// ---- antenna tips --------------------------------------------------------
// What caps the end of a stalk. Every tip is modeled in the SAME frame the
// rope segments use — +Z is the direction of growth, +X the width, +Y the
// thickness — so drawRope() aims any of them with one quaternion and scales
// them with one vector: see beadRadius() for the size, times tipFlat and
// tipAspect for the other two axes.
// A preset picks a shape and states those two ratios; it never touches
// geometry. That is the whole reason a tip can be swapped freely under any
// head: nothing about a tip knows what it is standing on.
//
// The one thing a tip DOES have to declare is where its origin sits, because
// metrics() has to know how far past the last rope point it reaches. A ball
// straddles the tip (`anchored: false`); a leaf and a mushroom cap grow out of
// it, base at the origin (`anchored: true`).

// A blade: two curves from base to point, extruded thin and rounded off. Built
// a unit long in Z and a unit ACROSS in X, so `beadSize` reads as the leaf's
// half-width and `tipAspect` stretches it out into a leaf shape.
const LEAF_GEO = (() => {
  const shape = new THREE.Shape();
  // A small flat base rather than a second point. Two curves meeting in a cusp
  // there would leave a corner of about 19 degrees, and ExtrudeGeometry offsets
  // a bevel by 1/sin(half-angle) — which turns a 0.03 bevel into a third of the
  // leaf's width, sticking out backwards down the stalk. Blunt it and the
  // corner goes near-straight, where that factor is 1.
  shape.moveTo(0.05, 0);
  // Widest at ~40% of the length and drawn to a point at the far end — a
  // symmetrical ellipse reads as a petal, and the shoulder is what says leaf.
  shape.bezierCurveTo(0.75, 0.14, 1, 0.5, 0, 1);
  shape.bezierCurveTo(-1, 0.5, -0.75, 0.14, -0.05, 0);
  shape.lineTo(0.05, 0);
  // depth + 2 * bevelThickness = 1, so the finished blade is exactly one unit
  // thick and `tipFlat` is the whole story on how flat it is.
  const bevelThickness = 0.15;
  const depth = 1 - 2 * bevelThickness;
  const g = smoothGeo(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 10,
    }),
  );
  // Center the thickness, then stand the blade up: the shape was drawn in XY
  // with its length in +Y, and everything downstream wants length in +Z.
  g.translate(0, 0, -depth / 2);
  g.rotateX(Math.PI / 2);
  return g;
})();

// A mushroom cap: widest where it meets the stalk, closed off underneath by a
// flat lid at radius 1, and drawn up to a point. `tipAspect` is how tall it
// stands — well under 1 gives a wide shallow cap, near 1 a witch's hat.
//
// Two knobs shape it, and they are the only two:
//
//   bulge   0 is the straight cone: radius falls off linearly, which is what
//           reads as too conical. Above 0 the profile swells outward and the
//           cap turns domed, 1 being a fat button mushroom. It is one exponent
//           on the falloff, nothing more.
//   wobble  0 is a perfect solid of revolution. Above 0 each vertex is pushed
//           in or out along its own radius by the same value noise the head's
//           bumps use, so the rim goes off-round and the dome goes uneven —
//           the same lattice, so a wobbled cap sits in the same visual family
//           as a lumpy head rather than looking like a different material.
//
// Unlike the other two tips this is cut per doll, because its shape depends on
// numbers that were drawn. dispose() drops it.
function coneGeometry(
  bulge,
  wobble,
  seed,
  aspect = 1,
  flat = 1,
  bump = null,
  scale = 0,
) {
  const R = 20; // radial segments
  // Ring count chosen so the quads come out about square once the mesh is
  // scaled (`aspect` along the length, `flat` across): slant height over the
  // face width at mid-height, both measured in scaled units.
  const m = (1 + flat) / 2; // mean cross-section radius factor
  const N = Math.max(
    3,
    Math.round((Math.hypot(aspect, m) * 2 * R) / (Math.PI * (1 + flat))),
  );
  const pts = [
    new THREE.Vector2(0, 0), // axis at the base
    new THREE.Vector2(1, 0), // out to the rim — the flat lid, underneath
  ];
  // r = (1 - u) is the cone. Raising it to 1/k with k > 1 holds the radius out
  // longer before it closes, which is the swell — and the apex still lands at
  // exactly (0, 1) whatever k is, so `bulge` never changes how tall the cap is.
  const k = 1 + 3 * Math.max(0, bulge);
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    pts.push(new THREE.Vector2(Math.pow(1 - u, 1 / k), u));
  }

  const g = new THREE.LatheGeometry(pts, R);
  if (wobble > 0) {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const r = Math.hypot(x, z);
      // The axis vertices have no radius to push along — and pushing them
      // would tear the apex off the center.
      if (r < 1e-6) continue;
      // Keyed to DIRECTION and height rather than to position, so the two ends
      // of the lathe seam get the same number and mergeVertices() below can
      // still weld them. Sampled at the same frequency all the way up, so the
      // dent in the rim carries on into the dome instead of stopping at it.
      const n = nNoise((x / r) * 2 + seed, y * 2.5, (z / r) * 2 + seed) - 0.5;
      const scale = 1 + wobble * n * 2;
      pos.setXYZ(i, x * scale, y, z * scale);
    }
  }
  // The doll's own texture field, so the tip is cut from the same stock as
  // the head. The field was tuned against a unit head and this mesh is drawn
  // at `scale` of that, so the config is resampled to match PHYSICALLY:
  // `detail` multiplied by the scale so one cut spans the same distance it
  // does on the head, `amplitude` divided by it so the cut goes as deep.
  if (bump && bump.amplitude > 0 && scale > 0) {
    const bt = {
      ...bump,
      amplitude: bump.amplitude / scale,
      detail: Math.max(2, bump.detail * scale),
      // This mesh's own ceiling, not the head's — R around the ring is the
      // resolution that actually exists here.
      maxFreq: Math.min(bump.maxFreq, R / 2),
    };
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      // Sampled and displaced along the direction from the cone's mid-axis,
      // like the head's undeformed-sphere direction: every copy of a welded
      // point (the lathe seam, the apex, the lid center) shares a direction,
      // so they move together and mergeVertices() below still welds them.
      const dx = x,
        dy = y - 0.5,
        dz = z;
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-6) continue;
      const d = bumpAt(bt, dx / len, dy / len, dz / len);
      if (d === 0) continue;
      pos.setXYZ(i, x + (dx / len) * d, y + (dy / len) * d, z + (dz / len) * d);
    }
  }
  const out = smoothGeo(g);
  out.rotateX(Math.PI / 2);
  return out;
}

const orientStack = (h) =>
  h.stack === "descending" ?
    {
      ...h,
      radius: h.radius * h.taper,
      taper: 1 / h.taper,
      beadSize: h.beadSize / h.taper,
    }
  : h;

// `make` marks a tip whose geometry depends on the draw and so has to be cut
// per doll; the other two are one shared mesh each.
const TIPS = {
  ball: { geo: BALL_GEO, anchored: false },
  leaf: { geo: LEAF_GEO, anchored: true },
  cone: {
    anchored: true,
    // The tip's mean world scale across its three axes — what beadRadius and
    // the aspect scaling in updateHair() will actually draw it at — so the
    // texture pass above can match the head's cut size physically.
    make: (h, seed, bump) =>
      coneGeometry(
        h.capBulge,
        h.capWobble,
        seed,
        h.tipAspect,
        h.tipFlat,
        bump,
        (beadRadius(h) * (1 + h.tipFlat + h.tipAspect)) / 3,
      ),
  },
};

// How far forward of the last rope point a tip is set down.
//
// A straddling ball is centered ON that point, which is what tucks it into the
// end of a barrel or a tube: those stalks are still at full width where they
// stop, so half a ball sunk into the end reads as a joint. A bead stalk is the
// opposite case — its top sphere CLOSES on that point — so a straddling ball
// buries its lower half in the bead below and the two read as one lump. Set it
// down on top instead, one of its own half-lengths along the last link, and
// the stack finishes with a ball resting on a ball.
//
// Anchored tips already grow forward from the point and want none of this.
const tipOffset = (h) =>
  STALKS[h.stalk].pointed && !TIPS[h.tip].anchored ?
    beadRadius(h) * h.tipAspect
  : 0;

export { tubeGeometry, TIPS, tipOffset, orientStack };
