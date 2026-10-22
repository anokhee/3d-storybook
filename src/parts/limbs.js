import * as THREE from "three";

import { smoothGeo, lerp, span, drawCount } from "../renderGrid/utils.js";
import { BANDS } from "../presets/index.js";

// An antenna is a chain of these: a stubby barrel that meets its neighbors
// flush, plus one ball to cap the tip. `taper` squeezes the far end, so a
// chain of them reads as one tapering rope rather than a stack of tubes.
function limbGeometry(taper) {
  const pts = [];
  const k = 12;
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const t = 1 + (taper - 1) * u;
    const r = Math.pow(1 - Math.pow(u, k), 1 / k);
    pts.push(new THREE.Vector2(Math.max(0, t * r), u));
  }
  const g = smoothGeo(new THREE.LatheGeometry(pts, 10));
  g.rotateX(Math.PI / 2);
  return g;
}
const SEGMENT_GEO = limbGeometry(1);

// `frustum` says which of the two radius laws a stalk follows, and
// whether its geometry has to be built per doll — a barrel is one shared mesh,
// a tube's shape depends on the taper it was dealt.
//
// One bead per rope link: a ball drawn across the whole link, so a chain of
// them is a stack of beads touching at the joins rather than one continuous
// limb. It follows the BARREL law on purpose — that law ramps the radius
// linearly from `radius` at the foot to `radius * taper` at the top, so a
// stack starts at the smallest bead and ends at the largest with nothing but
// those two numbers stating it.
//
// The profile is a true half-circle across the link, and the link is cut to
// the bead's own diameter — see fitBeadStack(), which sets the rope's `length`
// from the radii rather than the other way round. That is what makes every
// bead an actual SPHERE at whatever size the ramp dealt it, instead of an egg
// at the foot and a button at the top.
const BEAD_STACK_GEO = (() => {
  const N = 16;
  const pts = [];
  // r(u) = sqrt(1 - (2u - 1)^2): the half-circle of radius 1 about u = 0.5, so
  // the lathe is a ball a unit across in every direction once the link it is
  // scaled into is a unit long. Zero at both ends is what makes neighbors
  // meet at a point rather than a step.
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(
      new THREE.Vector2(Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)), u),
    );
  }
  const g = smoothGeo(new THREE.LatheGeometry(pts, 16));
  g.rotateX(Math.PI / 2);
  return g;
})();
// The bead stack's angular cousin: two cones base to base, the diamond of a
// strung jewelry bicone. Same contract as BEAD_STACK_GEO — widest (radius 1)
// at u = 0.5, closed to a point at both ends, so a chain of them touches
// point to point and follows the same barrel-law fitting. drawRope()'s
// anisotropic scale makes each one as long as its link, and the stringing law
// cuts every link to the bead's own diameter — a 45-degree diamond.
//
// The equator is stated TWICE, a hair apart, on purpose: smoothGeo() welds
// and smooths, and one shared ring there would average the two cone faces
// into a soft bulge. The near-double ring keeps the arris — the whole point
// of a bicone — while the tips stay pole-smoothed like the sphere's.
const BICONE_STACK_GEO = (() => {
  const E = 0.02;
  const pts = [
    [0, 0],
    [1, 0.5 - E],
    [1, 0.5 + E],
    [0, 1],
  ].map(([r, u]) => new THREE.Vector2(r, u));
  const g = smoothGeo(new THREE.LatheGeometry(pts, 16));
  g.rotateX(Math.PI / 2);
  return g;
})();
// `pointed` marks a stalk whose every link closes to a point at both ends —
// what fitBeadStack() (cut the rope to the beads), tipOffset() (rest the ball
// ON the last bead) and drawRope()'s root inset (no rim to hide) all key off.
const STALKS = {
  barrel: { geo: SEGMENT_GEO, frustum: false },
  tube: { frustum: true },
  bead: { geo: BEAD_STACK_GEO, frustum: false, pointed: true },
  bicone: { geo: BICONE_STACK_GEO, frustum: false, pointed: true },
};

const BALL_GEO = smoothGeo(new THREE.IcosahedronGeometry(1, 2));

// The half-width a tip is actually drawn at. `beadSize` is the band; the
// finished size is that divided by `count`, so a crown that gains antennae
// gets finer tips rather than a bunch of grapes — the band stays a statement
// about ONE antenna and the crowd handles itself.
//
// Everything reads this rather than the raw band, metrics() included: spacing
// a row against a size nothing was drawn at is how a leaf ends up spearing the
// doll above.
const beadRadius = (h) => h.beadSize / Math.max(1, h.count);

// The same rule for the stalk itself: `radius` and `topRadius` are bands about
// ONE antenna, and what gets drawn is each over `count`, so a crowded crown
// comes out as a spray of fine stalks rather than a fistful of dowels.
//
// Note this cancels out of the taper: the step from one segment to the next is
// topRadius / radius, and dividing both by the same count leaves that ratio
// exactly where it was. The stalk gets thinner, never a different shape.
const stalkRadius = (h) => h.radius / Math.max(1, h.count);
const stalkTopRadius = (h) => h.topRadius / Math.max(1, h.count);

// Which end of the antenna the big bead is on. `beadStack` states its ramp one
// way — `radius` is the SMALL bead and `taper` the ratio to the big one — and
// `stack`, dealt per doll off the preset's `ascendingChance`, says which way
// round to read it.
//
// Descending is that same ramp backwards, so rather than teaching drawRope a
// third radius law it is folded into the two numbers the barrel law already
// reads: start at the big bead, step DOWN by the same ratio. The tip goes with
// it, so the run finishes on the size the stalk was heading for either way.
//
// Every other preset leaves `stack` at "ascending" and is untouched by this —
// `taper` above 1 is what makes a ramp visible at all, and theirs squeeze.
// The barrel law, in one place: a linear ramp from `radius` at the foot to
// `radius * taper` at the far end. drawRope() scales each segment by it, and
// fitBeadStack() below adds the diameters up — two readings of one law, which
// is the only way a stack of balls can be made to touch.
const rampRadius = (h, i, n) =>
  stalkRadius(h) * (1 + (h.taper - 1) * (i / Math.max(1, n - 1)));

// A stack of balls only reads as a stack if the balls TOUCH, and a ball is
// only round if its link is exactly as long as it is wide. Both fall out of
// one move: cut the rope to the beads instead of the beads to the rope. So for
// the `bead` stalk the drawn `length` is replaced by the sum of the diameters
// the ramp is about to produce, and stepRope's segLen — length / segments —
// lands on each bead's own diameter.
//
// `length` is still drawn like every other key, and everything downstream
// (the solver, metrics(), the row spacing) reads the fitted number, so a bead
// stack is spaced by the height it actually stands at.
const fitBeadStack = (h) => {
  if (!STALKS[h.stalk].pointed) return h;
  const n = Math.max(1, h.segments);
  let length = 0;
  for (let i = 0; i < n; i++) length += 2 * rampRadius(h, i, n);
  return { ...h, length };
};

// Arms and legs are ropes, and drawRope()/stepRope() have since grown up
// around the antennae — they read `count`, `beadSize`, `tip`, `tipFlat` and
// `tipAspect` off whatever config they are handed. So a limb is described in
// exactly that vocabulary rather than in one of its own: a barrel stalk with a
// ball on the end, count 1 so stalkRadius() and beadRadius() divide by nothing
// and `radius`/`ballSize` land as the world sizes they are named for. One rope
// pipeline, two kinds of thing hanging off it.
function buildLimbBands(draw, size, bodyKey, limbKey) {
  const B = BANDS;
  const L = { ...B.limbDefaults, ...B.limbs[limbKey] };
  // The body's own limb bands, key by key over the defaults — the same
  // seed-safe merge the hair block does: the reads below walk a fixed key
  // list, so a body restating band VALUES never adds or removes a draw.
  const bp = B.bodies[bodyKey];
  const armsB = { ...B.bodyDefaults.arms, ...(bp.arms ?? {}) };
  const legsB = { ...B.bodyDefaults.legs, ...(bp.legs ?? {}) };
  // The shared limb block: ONE set of numbers for what a limb is — thickness,
  // jitter, ball, taper, reach — drawn once below so all four limbs come off
  // the same lathe. `arms`/`legs` keep only placement.
  const limbB = { ...B.bodyDefaults.limb, ...(bp.limb ?? {}) };
  // The spacer block is the body's now, bands rather than fixed numbers —
  // merged key-by-key like the neck's, so a body that only restates `scale`
  // keeps the default `tube` — then drawn ONCE and worn by all four limbs
  // (one torus cut per doll, see spacerGeo).
  const spacerB = { ...B.bodyDefaults.spacer, ...(bp.spacer ?? {}) };
  const spacer = { scale: draw(spacerB.scale), tube: draw(spacerB.tube) };
  // And the bead block on the same footing: the non-spacer links' width over
  // the limb's radius, drawn once and worn by all four limbs. It rides the
  // config as `beadWidth` — `beadSize` was already taken by the tip ball —
  // and only drawRope()'s segment scale reads it, so the spacers and the end
  // balls keep sizing off the bare `radius` ramp.
  const beadB = { ...B.bodyDefaults.bead, ...(bp.bead ?? {}) };
  const beadWidth = draw(beadB.scale);
  // One link count for every limb on the doll, off the body's own band —
  // indexed rather than lerped, so every count in the band comes up evenly.
  const segments = drawCount(
    draw,
    bp.limbSegments ?? B.bodyDefaults.limbSegments,
  );
  // 0 at the smallest body, 1 at the largest: the dial the derived params
  // hang off. A pinned `size` has no span, so it sits in the middle.
  const [sizeMin, sizeMax] = span(B.bodyDefaults.size);
  const heft = sizeMax > sizeMin ? (size - sizeMin) / (sizeMax - sizeMin) : 0.5;

  // Reach is the shared block's too. Legs are the base — they set the stance
  // and how the doll meets the ground — and the arms hang off them by ratio,
  // so the arm/leg pairing is always a statement rather than two uncorrelated
  // draws: [1, 1] pins them equal, a low band runs arms shorter, and only a
  // wide band deals the old chaos back.
  const legLen = draw(limbB.length);
  const armLen = legLen * draw(limbB.armRatio);
  // Limb thickness follows body size rather than being drawn on its own: a
  // 1.5-scale body on 0.05-radius arms is a bug, not a variant, and
  // independent draws produce that pairing as often as any other. The jitter
  // keeps thickness surprising without decoupling it. ONE jitter, one ball
  // ratio, one taper — arms and legs used to draw their own of each and came
  // out mismatched; now the whole cross-section is a single deal per doll.
  const [rLo, rHi] = span(limbB.radius);
  const radius = lerp(rLo, rHi, heft) * draw(limbB.radiusJitter);
  const ball = radius * draw(limbB.ballRatio);
  const taper = draw(limbB.taper);

  // The rope vocabulary every limb shares. `count` 1 is the load-bearing one:
  // an antenna divides its radius and its bead by how many of them there are,
  // and a limb wants neither of those divisions.
  //
  // No stalk bends any of these numbers any more. Every limb is `segments`
  // links over the drawn `length`, so each link — each non-spacer bead — is
  // simply length / segments long, and its width is the shared `limb.radius`
  // band times the body's `bead.scale`. The old bead law (count from the
  // preset's chubbiness, radius re-solved so every bead came out a true
  // sphere) is gone on purpose: the body states the count and the width, and
  // a bead stretches or squashes along its link to fit — squashed discs when
  // the links run shorter than the beads are wide, stretched eggs when they
  // run longer.
  //
  // Only `length` is the rope's own now; everything else is the one shared
  // deal, which is what keeps an arm and a leg reading as parts of one doll.
  //
  // `clearance` is the solid-body law, one number per interior rope point:
  // the half-width of the widest thing DRAWN at that point — the fatter of
  // the two beads meeting there, the spacer's outer rim (ring times 1 + tube),
  // or, at the last point, the tip ball. collideWithBody() holds each point
  // that far off the surface, so a limb rests ON the torso by its flesh
  // rather than by its centerline — nothing half-sunk, body and limbs both
  // solid. Pure config, so it is worked out once here rather than per frame.
  const asRope = (len) => {
    const cfg = {
      stalk: L.stalk,
      count: 1,
      length: len,
      radius,
      topRadius: radius,
      taper,
      segments,
      ballSize: ball,
      beadSize: ball,
      beadWidth,
      tip: "ball",
      tipFlat: 1,
      tipAspect: 1,
      stalkCurve: 0,
      spacer,
    };
    cfg.clearance = [];
    for (let i = 1; i < segments; i++) {
      const rA = rampRadius(cfg, i - 1, segments);
      const rB = rampRadius(cfg, i, segments);
      cfg.clearance.push(
        Math.max(
          Math.max(rA, rB) * beadWidth,
          spacer.scale * ((rA + rB) / 2) * (1 + spacer.tube),
        ),
      );
    }
    cfg.clearance.push(ball);
    return cfg;
  };

  return {
    arms: {
      y: draw(armsB.y),
      spread: draw(armsB.spread),
      ...asRope(armLen),
    },
    legs: {
      spread: draw(legsB.spread),
      ...asRope(legLen),
    },
  };
}

export {
  STALKS,
  BALL_GEO,
  beadRadius,
  stalkRadius,
  stalkTopRadius,
  rampRadius,
  fitBeadStack,
  buildLimbBands,
};
