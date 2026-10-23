import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { GOAT } from "./objects.js";

// Where everything sits, at size 1: the cat's frame (see cat/Cat.jsx)
// with a goat's parts on it, standing only. The goat is one lump (see
// world/lump.js): `parts` are the forms it is poured from — a rounded
// block for the body, each leg a slimmer block pulled straight down out
// of one of its corners to the ground, a NECK block leant forward out of
// the top of its front, a narrower HEAD block across the top of the
// neck, nosing down a little, a smaller muzzle block out of the head's
// front, and the tail a run of capsules out of the top of its rump. The
// neck runs well down into the body and the head well back over the
// neck, each filleting into what it meets, so nothing meets at a seam.
// The face is drawn in the head's own frame: `head` is the block's
// middle, `tilt` how far it noses down (the eyes, ears, horns, nose and
// beard go with it) and `half` how far its surface reaches each way
// from the middle. `patch` is the darker patch painted over the back, a
// disc `d` across at `at`, projected down onto the lump along its own
// -z turned `turn`, `depth` deep; `spots` the fawn spots (a deer's), each
// a smaller disc the same way, over the back and in from the flanks;
// `hooves` the feet the dark hooves are painted round, each a box `at`
// and `size` across, tall and deep. The
// tail is a curve of `points` from where it leaves the rump to its tip,
// `rootR` thick where it leaves and `tipR` at the tip; the wag bends it
// from the root, `sway` scaling that. `antlers` are the parts of a
// SECOND small lump, in the head's own frame: each side a beam up and
// out off the top of the head to a first joint, up and curving forward
// to a second, then on to its tip, thinner at every step, with a tine
// forward off the first joint and one outward off the second run (the
// deer's). `top` is how tall the goat stands to the top of its head,
// `hornTop` to the tips of its horns, `antlerTop` to its antlers' and
// `ossiconeTop` to its ossicones'.
const NECK_W = 0.2, NECK_DEPTH = 0.22, NECK_ROUND = 0.06, NECK_SINK = 0.22; // the neck block, and how far down into the body it runs
// The muzzle: a block out of the lower half of the head's front, `size`
// across, tall and deep, its edges rounded `round`, its front `out`
// ahead of the head's, its middle `down` below the head's.
const MUZZLE = { size: [0.14, 0.13, 0.18], round: 0.04, out: 0.1, down: 0.04 };
// The snout, worn instead (a giraffe's): after the cow's muzzle (see
// cow/Cow.jsx), long and tapering — a broad block `back` sunk `inset`
// into the head's front, `down` below its middle, and a narrower block
// `front` ahead of it, run together so it narrows to the end, the whole
// turned `droop` further nose-down than the head; `reach` how far its
// end is ahead of where it leaves the head. Painted from `from` ahead
// of the head's front outwards, with two bead nostrils `nostrilX` either
// side of the middle of its end in place of the nose.
const SNOUT = { back: [0.17, 0.13, 0.16], front: [0.14, 0.11, 0.12], round: 0.045, inset: 0.06, reach: 0.15, down: 0.03, droop: 0.45, from: 0.015, nostrilX: 0.038, nostrilR: 0.019 };
// Or the cow's own (see cow/Cow.jsx), worn instead (a horse's or a
// zebra's): a broad shallow block out of the lower half of the head's
// front, not turned down past the head, `depth` deep and `out` ahead of
// it as shares of the head's length; how wide and tall it is, how far
// below the head's middle and how rounded are the config's `cowSnout`
// (the cow's own proportions, or the head's own for a snout running
// straight on out of it); painted from `from` ahead of the head's front,
// with two bead nostrils `nostrilX` either side on its front, `nostrilY`
// of its height below its middle.
const COW_SNOUT = { depth: 0.45, out: 0.27, from: 0.02, nostrilX: 0.045, nostrilY: 0.25, nostrilR: 0.016 };
// The mane (a horse's or a zebra's): a row of capsules standing off the
// neck's back from the top of the head — the neck's own top end, which
// runs up past the head's middle to level with its top — down to just
// above the withers (`from` along the neck), each `r` thick and
// `length` long between its round ends, sunk `sink` into the neck.
const MANE = { count: 12, r: 0.024, length: 0.035, from: 0.2, sink: 0.03 };
const STRIPE = { body: 0.042, neck: 0.036, head: 0.03, leg: 0.03 }; // how wide each kind of a zebra's stripe is
// A ring's turn: a box frame with its y along `axis` and its x along
// `across`, so the box lies square across the part, as an Euler.
const ringTurn = (axis, across) => {
  const x = across.clone().normalize(), y = axis.clone().normalize(), z = new THREE.Vector3().crossVectors(x, y);
  return new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)).toArray().slice(0, 3);
};
const EYE_R = 0.036, EYE_Y = 0.035, EYE_Z = 0.05; // the beads, on the sides of the head
const BAR = [0.04, 0.012, 0.012]; // the pupil, a bar across the bead's outer face
const EAR_R = 0.042, EAR_BACK = 0.25, EAR_TIP = 0.35; // an ear: a capsule out to the side, flattened, swept back; its length and droop are the config's
const TAIL_FROM = 0.03; // how far along the tail (its eased weight, see world/lump.js) the tail's colour starts
const OSSICONE = { r: 0.024, knob: 0.032, foot: 0.045, height: 0.12 }; // a giraffe's: a short peg up off the top of the head, `foot` out from the middle, with a ball on its end
const HANG = { r: 0.012, tuft: 0.03 }; // the hanging tail: the rod's thickness at the root, and the tuft's
const BEARD = { top: 0.045, tip: 0.01, length: 0.14, back: 0.08 }; // the beard: a cone hanging from under the chin, `back` of the head's front
// A fawn spot's blotch: two to four discs `d` across, each offset `u`
// and `v` from the spot's middle in the plane it is painted on, a big
// one and smaller ones lumped off its edge in a direction of their own.
// `n` picks which blotch, the same every time.
const rand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// The giraffe's patches: octagons tiled close over the back — behind
// the neck — and down either flank, each row shifted half a step from
// the last, each patch nudged off the grid a little so the coat between
// runs in uneven lines.
const PATCH_R = 0.055, PATCH_STEP = 0.13;
function octagons(B, top, bottom) {
  const out = [];
  const add = (at, turn, depth, n) => out.push({ at: [at[0] + (rand(n + 0.1) - 0.5) * 0.02, at[1] + (rand(n + 0.4) - 0.5) * 0.02, at[2] + (rand(n + 0.6) - 0.5) * 0.02], turn, d: PATCH_R * 2.6, depth, edges: octagon(n, PATCH_R) });
  let n = 0;
  [-0.065, 0.065].forEach((x, row) => {
    for (let z = -B.length / 2 + 0.07 + (row % 2) * PATCH_STEP / 2; z <= 0.05; z += PATCH_STEP) add([x, top + 0.02, z], [-Math.PI / 2, 0, 0], 0.14, n++);
  });
  for (const s of [-1, 1]) {
    [0.22, 0.52, 0.82].forEach((t, row) => {
      for (let z = -B.length / 2 + 0.07 + (row % 2) * PATCH_STEP / 2; z <= B.length / 2 - 0.04; z += PATCH_STEP) add([s * (B.width / 2 + 0.1), bottom + B.height * t, z], [0, s * Math.PI / 2, 0], 0.3, n++);
    });
  }
  return out;
}
// And up the neck: rows of them along it from `from` to `to` high,
// round all four sides — a patch on each side, and on the front and the
// back half a step further along, so they stagger round the neck — each
// a shallow box against its face, turned with the neck's lean.
function neckOctagons(foot, lean, from, to) {
  const out = [];
  const up = [0, Math.cos(lean), Math.sin(lean)], fwd = [0, -Math.sin(lean), Math.cos(lean)];
  const at = (t, across, out_) => [across, foot[1] + up[1] * t + fwd[1] * out_, foot[2] + up[2] * t + fwd[2] * out_];
  let n = 100;
  for (let t = (from - foot[1]) / up[1]; foot[1] + up[1] * t <= to; t += PATCH_STEP * 0.9) {
    for (const s of [-1, 1]) out.push({ at: at(t, s * NECK_W / 2, 0), turn: [lean, s * Math.PI / 2, 0], d: PATCH_R * 2.6, depth: 0.12, edges: octagon(n++, PATCH_R) });
    const t2 = t + PATCH_STEP * 0.45;
    if (foot[1] + up[1] * t2 > to) continue;
    out.push({ at: at(t2, 0, NECK_DEPTH / 2), turn: [lean, 0, 0], d: PATCH_R * 2.6, depth: 0.12, edges: octagon(n++, PATCH_R) });
    out.push({ at: at(t2, 0, -NECK_DEPTH / 2), turn: [lean + Math.PI, 0, 0], d: PATCH_R * 2.6, depth: 0.12, edges: octagon(n++, PATCH_R) });
  }
  return out;
}
// A giraffe's patch: an octagon `r` out to its edges, each edge turned
// and pushed in or out a little by noise so no two are alike, the whole
// turned too. `n` picks which, the same every time.
function octagon(n, r) {
  const turn = rand(n + 0.9) * Math.PI;
  return Array.from({ length: 8 }, (_, k) => ({ a: turn + (k * Math.PI) / 4 + (rand(n * 11 + k) - 0.5) * 0.35, r: r * (0.8 + rand(n * 13 + k + 0.2) * 0.35) }));
}
function blotch(n) {
  const discs = [[0, 0, 0.034 + rand(n) * 0.022]];
  const more = 1 + Math.floor(rand(n + 0.5) * 3);
  for (let k = 0; k < more; k++) {
    const a = rand(n * 7 + k) * Math.PI * 2, r = 0.012 + rand(n * 3 + k + 0.3) * 0.016;
    discs.push([Math.cos(a) * r, Math.sin(a) * r, 0.016 + rand(n * 5 + k + 0.7) * 0.022]);
  }
  return discs;
}
// The mane along the outline of the back of the neck and head, seen
// from the side: up the neck's back from the withers to under the head,
// then up the head's back and round its rounded top corner onto its
// top — the head's back sticks out behind the neck's, so a mane run
// straight on up the neck would go through it. The outline is sampled
// finely, each sample a point on the surface and the angle of the way
// out of it (a turn about x of a capsule's y); the capsules are spaced
// evenly along it, from the top of the head down.
function maneOf(foot, up, fwd, neckLen, H, half, onHead) {
  const line = [];
  const neckAt = (t) => [0, foot[1] + up[1] * t - fwd[1] * NECK_DEPTH / 2, foot[2] + up[2] * t - fwd[2] * NECK_DEPTH / 2];
  // Where the head's back starts, low on it, up the neck's axis
  const r = H.round, low = -half[1] + r;
  const tHead = neckLen + (-half[2]) * Math.sin(H.neck - H.tilt) + low * Math.cos(H.tilt - H.neck);
  const t0 = MANE.from * neckLen;
  for (let k = 0; k <= 20; k++) line.push({ p: neckAt(t0 + ((tHead - t0) * k) / 20), a: H.neck - Math.PI / 2 });
  for (let k = 0; k <= 10; k++) line.push({ p: onHead(low + ((half[1] - r - low) * k) / 10, -half[2]), a: H.tilt - Math.PI / 2 });
  for (let k = 1; k <= 10; k++) {
    const th = (k / 10) * (Math.PI / 2);
    line.push({ p: onHead(half[1] - r + r * Math.sin(th), -half[2] + r - r * Math.cos(th)), a: H.tilt - Math.PI / 2 + th });
  }
  const along = [0];
  for (let i = 1; i < line.length; i++) along.push(along[i - 1] + Math.hypot(line[i].p[1] - line[i - 1].p[1], line[i].p[2] - line[i - 1].p[2]));
  const total = along[along.length - 1], lift = MANE.length / 2 + MANE.r - MANE.sink;
  return Array.from({ length: MANE.count }, (_, i) => {
    const d = total - (total * i) / (MANE.count - 1);
    const j = Math.max(1, along.findIndex((x) => x >= d));
    const f = (d - along[j - 1]) / (along[j] - along[j - 1] || 1);
    const a = line[j - 1].a + (line[j].a - line[j - 1].a) * f;
    const p = [0, line[j - 1].p[1] + (line[j].p[1] - line[j - 1].p[1]) * f, line[j - 1].p[2] + (line[j].p[2] - line[j - 1].p[2]) * f];
    return { at: [0, p[1] + Math.cos(a) * lift, p[2] + Math.sin(a) * lift], turn: [a, 0, 0] };
  });
}
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const H = C.head;
  const block = (at, size, round, tilt = 0, blend = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, tilt, blend });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the neck out of the
  // top of its front, the head on that, the tail out of the top of its
  // rear pointing up.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = L.height, bottom = legTop - 0.14, top = bottom + B.height;
  // The neck: a block leant forward H.neck, its foot NECK_SINK down
  // inside the body's front half and its top reaching up to the head's
  // middle, so the head sits H.rise over the body's top and out ahead
  // of its front.
  const neckFoot = [0, top - NECK_SINK, B.length / 2 - NECK_DEPTH / 2 - 0.02];
  const head = [0, top + H.rise, 0];
  const neckLen = (head[1] - neckFoot[1]) / Math.cos(H.neck);
  head[2] = neckFoot[2] + neckLen * Math.sin(H.neck);
  const neckAt = [0, (neckFoot[1] + head[1]) / 2, (neckFoot[2] + head[2]) / 2];
  const neckUp = [0, Math.cos(H.neck), Math.sin(H.neck)], neckFwd = [0, -Math.sin(H.neck), Math.cos(H.neck)]; // the way the neck runs, and its own forward
  // A point `dy` up and `dz` forward of the head's middle, in its own nosing-down frame
  const onHead = (dy, dz) => [0, head[1] + dy * Math.cos(H.tilt) - dz * Math.sin(H.tilt), head[2] + dy * Math.sin(H.tilt) + dz * Math.cos(H.tilt)];
  const half = [H.width / 2, H.height / 2, H.length / 2];
  const muzzleAt = onHead(-MUZZLE.down, half[2] + MUZZLE.out - MUZZLE.size[2] / 2);
  // The snout's frame: from where it leaves the head's front, `dz` along
  // it and `dy` up, turned SNOUT.droop further down than the head
  const snoutTilt = H.tilt + SNOUT.droop, snoutBase = onHead(-SNOUT.down, half[2]);
  const onSnout = (dy, dz) => [0, snoutBase[1] + dy * Math.cos(snoutTilt) - dz * Math.sin(snoutTilt), snoutBase[2] + dy * Math.sin(snoutTilt) + dz * Math.cos(snoutTilt)];
  // The cow's snout's, in the head's frame
  const S = C.cowSnout;
  const cow = { size: [S.width * H.width, S.height * H.height, COW_SNOUT.depth * H.length], out: COW_SNOUT.out * H.length, down: S.down * H.height };
  const cowAt = onHead(-cow.down, half[2] + cow.out - cow.size[2] / 2);
  const muzzle = C.snout && C.snoutShape === "cow"
    ? [block(cowAt, cow.size, S.round, H.tilt, 0.03)]
    : C.snout
    ? [block(onSnout(0, SNOUT.back[2] / 2 - SNOUT.inset), SNOUT.back, SNOUT.round, snoutTilt, 0.03), block(onSnout(-0.008, SNOUT.reach - SNOUT.front[2] / 2), SNOUT.front, SNOUT.round, snoutTilt, 0.1)]
    : [block(muzzleAt, MUZZLE.size, MUZZLE.round, H.tilt, 0.03)];
  const hornTop = top + H.rise + half[1] + 0.2;
  // The antlers, in the head's frame (the face group's: y up the head, z
  // forward, so they nose down with it): capsules end to end, each
  // joint filleting a little into the next
  const A = 1.3, AR = 0.75; // the antlers' reach, scaled up to suit this head (bigger than the old deer's), and their thickness, scaled down
  const add = (a, d) => [a[0] + d[0] * A, a[1] + d[1] * A, a[2] + d[2] * A];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const run = (a, b, ra, rb, blend = 0.02) => ({ kind: "capsule", a, b, ra: ra * AR, rb: rb * AR, blend });
  const antlers = [-1, 1].flatMap((s) => {
    const base = [s * 0.028, half[1] - 0.04, -0.04];
    const k1 = add(base, [s * 0.03, 0.1, -0.03]);
    const k2 = add(k1, [s * 0.03, 0.09, 0.05]);
    const tip = add(k2, [s * 0.01, 0.05, 0.05]);
    const m = mid(k1, k2);
    return [
      run(base, k1, 0.03, 0.024),
      run(k1, k2, 0.024, 0.018),
      run(k2, tip, 0.018, 0.014),
      run(k1, add(k1, [-s * 0.01, 0.07, 0.07]), 0.02, 0.013), // the forward tine
      run(m, add(m, [s * 0.045, 0.07, 0.03]), 0.018, 0.013), // the outward tine
    ];
  });
  const antlerTop = Math.max(...antlers.map((a) => onHead(a.b[1] + a.rb, a.b[2])[1]));
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
      block(neckAt, [NECK_W, neckLen + NECK_DEPTH, NECK_DEPTH], NECK_ROUND, H.neck, H.neckBlend), // the neck, run on up past the head's middle
      block(head, [H.width, H.height, H.length], H.round, H.tilt, 0.04),
      ...muzzle,
    ],
    head,
    tilt: H.tilt,
    half,
    // The patch: one over the back from above, a little to one side and
    // back of the neck's foot so it does not climb the neck
    patch: { at: [0.04, top + 0.1, -0.13], turn: [-Math.PI / 2, 0, 0], d: 0.3, depth: 0.3 },
    // The snout paint: a box round the snout from SNOUT.from ahead of
    // the head's front to past its end, turned with it; and its frame,
    // for the nostrils on its end
    snout: C.snoutShape === "cow"
      ? { at: onHead(-cow.down, half[2] + (COW_SNOUT.from + cow.out + 0.04) / 2), size: [cow.size[0] + 0.04, cow.size[1] + 0.04, cow.out + 0.04 - COW_SNOUT.from], tilt: H.tilt, end: onHead(-cow.down - COW_SNOUT.nostrilY * cow.size[1] - 0.012, half[2] + cow.out), nostrilX: COW_SNOUT.nostrilX, nostrilR: COW_SNOUT.nostrilR }
      : { at: onSnout(0, (SNOUT.from + SNOUT.reach + 0.04) / 2), size: [SNOUT.back[0] + 0.04, SNOUT.back[1] + 0.06, SNOUT.reach + 0.04 - SNOUT.from], tilt: snoutTilt, end: onSnout(-0.008, SNOUT.reach), nostrilX: SNOUT.nostrilX, nostrilR: SNOUT.nostrilR },
    // The mane: capsules along the neck's back, each standing straight
    // off it (back and up, the way the neck leans) and sunk a little in
    mane: maneOf(neckFoot, neckUp, neckFwd, neckLen, H, half, onHead),
    // The stripes (a zebra's), each a box the paint is laid within:
    // `bands` across the body projected down from above, as wide as the
    // body and more and deep enough to wrap down both flanks, kept back
    // of where the neck rises, and two across the rump from behind; and
    // `rings` round the neck, the head behind the snout and each leg,
    // each a box square across its part and a little wider than it every
    // way, so it paints all round
    bands: [
      ...[0.06, -0.04, -0.13, -0.22, -0.3].map((z, i) => ({ at: [0, (top + 0.05 + bottom + 0.07) / 2, z], turn: [-Math.PI / 2, 0, 0], size: [B.width + 0.3, STRIPE.body * (i === 2 ? 1.25 : 1), top - bottom - 0.02] })),
      ...[top - 0.14, top - 0.26].map((y) => ({ at: [0, y, -B.length / 2 + 0.05], turn: [0, Math.PI, 0], size: [B.width - 0.06, STRIPE.body * 0.9, 0.18] })),
    ],
    rings: [
      ...[[0.3, 1.1], [0.45, 1], [0.6, 1], [0.75, 0.9], [0.9, 0.85]].map(([f, w]) => ({ at: [0, neckFoot[1] + neckUp[1] * f * neckLen, neckFoot[2] + neckUp[2] * f * neckLen], turn: ringTurn(new THREE.Vector3(...neckUp), new THREE.Vector3(...neckFwd)), size: [NECK_DEPTH + 0.06, STRIPE.neck * w, NECK_W + 0.06] })),
      ...[[-0.1, 1], [-0.03, 0.9], [0.04, 0.85]].map(([dz, w]) => ({ at: onHead(0, dz), turn: ringTurn(new THREE.Vector3(0, -Math.sin(H.tilt), Math.cos(H.tilt)), new THREE.Vector3(0, Math.cos(H.tilt), Math.sin(H.tilt))), size: [H.height + 0.08, STRIPE.head * w, H.width + 0.08] })),
      // each leg's at a few heights, spaced for legs 0.5 high and stretched to these
      ...feet.flatMap(([x, , z], i) => [[0.12, 0.2, 0.28, 0.36], [0.11, 0.19, 0.27, 0.35], [0.13, 0.21, 0.29, 0.37], [0.11, 0.2, 0.28, 0.36]][i].map((y, k) => ({ at: [x, y * legTop / 0.5, z], turn: [0, 0, 0], size: [L.thickness + 0.14, STRIPE.leg * (k === 1 ? 1.15 : 1), L.thickness + 0.14] }))),
    ],
    hooves: feet.map(([x, , z]) => ({ at: [x, 0.03, z], size: [L.thickness + 0.04, 0.06, L.thickness + 0.04] })),
    // The spots (a deer's): small blotches scattered down onto the back —
    // behind the neck, and shallow, so none catches the neck where it
    // rises — and in from either flank, each a few overlapping discs of
    // different sizes (see blotch) so no two are the same round shape
    spots: C.spotShape === "octagon" ? [...octagons(B, top, bottom), ...neckOctagons(neckFoot, H.neck, top + 0.05, head[1] - 0.15)] : [
      ...[[0.06, -0.3], [-0.07, -0.22], [0.1, -0.12], [-0.04, -0.04], [0.07, 0.04], [-0.1, -0.33], [0.02, -0.19], [-0.08, 0.03]].flatMap(([x, z], i) => blotch(i).map(([u, v, d]) => ({ at: [x + u, top + 0.02, z + v], turn: [-Math.PI / 2, 0, 0], d, depth: 0.14 }))),
      ...[[0.7, -0.22], [0.55, -0.06], [0.75, 0.1], [0.5, 0.22], [0.4, -0.3]].flatMap(([t, z], i) => blotch(i + 8).map(([u, v, d]) => ({ at: [B.width / 2 + 0.1, bottom + B.height * t + u, z + v], turn: [0, Math.PI / 2, 0], d, depth: 0.3 }))),
      ...[[0.65, -0.3], [0.5, -0.14], [0.72, 0.02], [0.55, 0.18], [0.4, 0.28]].flatMap(([t, z], i) => blotch(i + 13).map(([u, v, d]) => ({ at: [-(B.width / 2 + 0.1), bottom + B.height * t + u, z + v], turn: [0, -Math.PI / 2, 0], d, depth: 0.3 }))),
    ],
    tail: {
      points: [[0, top - 0.08, -B.length / 2 + 0.05], [0, top + 0.02, -B.length / 2 - 0.07], [0, top + 0.14, -B.length / 2 - 0.1]],
      rootR: 0.05,
      tipR: 0.03,
      sway: 1,
    },
    // The hanging tail, worn instead (a giraffe's): not part of the lump
    // but a thin rod of its own from `root` on the rump, out a little and
    // then down, through `bend` to `tip`, with a brush of a tuft on the
    // end, swung side to side about the root
    hang: { root: [0, top - 0.07, -B.length / 2 + 0.01], bend: [0, -0.07, -0.05], tip: [0, -0.4, -0.065] },
    top: top + H.rise + half[1],
    hornTop,
    ossiconeTop: top + H.rise + half[1] + OSSICONE.height + OSSICONE.knob,
    antlers,
    antlerTop,
  };
}

// How tall the goat stands off its ground: the tips of its antlers or
// horns, or the top of its head without them.
export function goatHeightOf(C) {
  const lay = layoutOf(C);
  return Math.max(lay.top, C.horns ? lay.hornTop : 0, C.antlers ? lay.antlerTop : 0, C.ossicones ? lay.ossiconeTop : 0) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, muzzle to tail along.
export function goatFootprintOf(C) {
  return { x: 0.3 * C.size, z: 0.65 * C.size };
}

// A rod from `a` to `b` in the head's frame, for a cylinder or capsule
// whose own axis is y: where its middle is, how it turns and how long.
const Y = new THREE.Vector3(0, 1, 0);
const rodOf = (a, b) => {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
  const dir = to.clone().sub(from);
  const length = dir.length();
  return { at: from.clone().lerp(to, 0.5).toArray(), turn: new THREE.Quaternion().setFromUnitVectors(Y, dir.divideScalar(length)), length };
};

// One goat, standing on the ground at y = 0 facing +z. `config` overrides
// any of GOAT's fields for this one instance.
export default function Goat({ config }) {
  const C = useMemo(() => merge(GOAT, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, legs, neck, head, muzzle and tail as one, poured
  // round the parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend.
  const tail = useMemo(() => (C.tail.hang ? [] : tailBalls(lay.tail)), [lay, C.tail.hang]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);
  // The lump drawn in two pieces sharing its vertices, so both follow
  // the wag: the tail's triangles (every corner well along the tail) in
  // the tail's colour, and the rest in the coat. The paint is laid on
  // the whole lump.
  const shown = useMemo(() => {
    const index = lump.geo.index.array, onTail = [], rest = [];
    for (let i = 0; i < index.length; i += 3) {
      const tri = [index[i], index[i + 1], index[i + 2]];
      (tri.every((v) => lump.weights[v] > TAIL_FROM) ? onTail : rest).push(...tri);
    }
    const view = (ids) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", lump.geo.attributes.position);
      g.setAttribute("normal", lump.geo.attributes.normal);
      g.setIndex(ids);
      g.boundingSphere = lump.geo.boundingSphere;
      return g;
    };
    return { body: view(rest), tail: view(onTail) };
  }, [lump]);
  useEffect(() => () => { shown.body.dispose(); shown.tail.dispose(); }, [shown]);

  // The patch, if it has one: a disc painted over the back — arched at
  // the top and rounded off at the bottom by half its width, so a
  // circle; and the hooves, each a box of paint round a foot.
  const patch = useMemo(() => (C.patch ? paintOn(lump.geo, new THREE.Vector3(...lay.patch.at), new THREE.Euler(...lay.patch.turn), [lay.patch.d, lay.patch.d, lay.patch.depth], { arch: true, radius: lay.patch.d / 2 }) : null), [C.patch, lump, lay.patch]);
  useEffect(() => () => patch?.dispose(), [patch]);
  const hooves = useMemo(() => lay.hooves.map((h) => paintOn(lump.geo, new THREE.Vector3(...h.at), new THREE.Euler(0, 0, 0), h.size)), [lump, lay.hooves]);
  useEffect(() => () => hooves.forEach((g) => g.dispose()), [hooves]);
  // The snout paint, if it wears the snout: a box round it, turned with
  // the head.
  const snout = useMemo(() => (C.snout ? paintOn(lump.geo, new THREE.Vector3(...lay.snout.at), new THREE.Euler(lay.snout.tilt, 0, 0), lay.snout.size) : null), [C.snout, lump, lay.snout]);
  useEffect(() => () => snout?.dispose(), [snout]);
  // The stripes, if it has them (a zebra's): the bands across the body
  // and rump and the rings round the neck, head and legs, each the
  // lump's surface within its box.
  const stripes = useMemo(() => (C.stripes ? [...lay.bands, ...lay.rings].map((b) => paintOn(lump.geo, new THREE.Vector3(...b.at), new THREE.Euler(...b.turn), b.size)) : []), [C.stripes, lump, lay.bands, lay.rings]);
  useEffect(() => () => stripes.forEach((g) => g.dispose()), [stripes]);
  // The spots, if it has them: each a disc of paint, a patch arched at
  // the top and rounded off at the bottom by half its width, so a circle
  // (or a giraffe's, an octagon trimmed by its edges)
  const spots = useMemo(() => (C.spots ? lay.spots.map((s) => paintOn(lump.geo, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), [s.d, s.d, s.depth], s.edges ? { edges: s.edges } : { arch: true, radius: s.d / 2 })) : []), [C.spots, lump, lay.spots]);
  useEffect(() => () => spots.forEach((g) => g.dispose()), [spots]);
  // The antlers, if it has them: a second small lump poured round both,
  // in the head's frame
  const antlers = useMemo(() => (C.antlers ? lumpOf(lay.antlers, { resolution: C.resolution }) : null), [C.antlers, lay.antlers, C.resolution]);
  useEffect(() => () => antlers?.dispose(), [antlers]);

  // The wag: the tail flicked quickly side to side about its root, each
  // vertex by its weight; or the hanging tail swung slowly, whole.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    bendTail(lump, lump.root, Math.sin(clock.current * 11) * 0.5 * C.wag * lay.tail.sway);
    if (hung.current) hung.current.rotation.z = Math.sin(clock.current * 3) * 0.35 * C.wag;
  });
  const hung = useRef();
  const hang = { r: C.tail.r ?? HANG.r, tuft: C.tail.tuft ?? HANG.tuft }; // a fuller tail than the giraffe's, if the config asks

  // The horns, in the head's frame: each in two pieces, a thicker lower
  // one up and back off the top of the head and a slimmer upper one
  // swept further back and out to a point, a ball at the knee between
  // them so the bend is smooth; the beard, a cone hanging from under
  // the chin, its top up inside it; the ears, flattened capsules out of
  // the sides of the head, swept back and drooping by the config's
  // `ears.droop` (negative, they stand up).
  const [hw, hh, hl] = lay.half;
  const horns = [-1, 1].map((s) => {
    const foot = [s * 0.05, hh - 0.02, -0.04];
    const knee = [s * 0.075, hh + 0.09, -0.1];
    const tip = [s * 0.12, hh + 0.16, -0.22];
    return { lower: rodOf(foot, knee), knee, upper: rodOf(knee, tip) };
  });
  const ossicones = [-1, 1].map((s) => {
    const foot = [s * OSSICONE.foot, hh - 0.02, -0.05];
    const tip = [s * (OSSICONE.foot + 0.015), hh + OSSICONE.height, -0.07];
    return { peg: rodOf(foot, tip), tip };
  });
  const beard = rodOf([0, -hh + 0.015, hl - BEARD.back], [0, -hh - BEARD.length, hl - BEARD.back - 0.03]);
  // An ear's shape: a capsule, or with `ears.point` its outer half drawn
  // out to a soft point, EAR_TIP of its thickness further
  const earShape = useMemo(() => {
    const p = C.ears.point ?? 0;
    if (!p) return <capsuleGeometry args={[EAR_R, C.ears.length, 4, 12]} />;
    const h = C.ears.length / 2 + EAR_R, profile = [];
    for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + (k / 6) * (Math.PI / 2); profile.push(new THREE.Vector2(EAR_R * Math.cos(a), -h + EAR_R + EAR_R * Math.sin(a))); }
    const tip = h + EAR_R * EAR_TIP * p;
    for (let k = 1; k <= 10; k++) { const u = k / 10; profile.push(new THREE.Vector2(EAR_R * ((1 - p) * Math.sqrt(1 - u * u) + p * (1 - u * u)), u * tip)); }
    return <latheGeometry args={[profile, 12]} />;
  }, [C.ears.point, C.ears.length]);
  const ears = [-1, 1].map((s) => {
    const root = [s * (hw - 0.02), 0.03, -0.03];
    const dir = new THREE.Vector3(s * Math.cos(C.ears.droop), -Math.sin(C.ears.droop), -EAR_BACK).normalize();
    const end = new THREE.Vector3(...root).addScaledVector(dir, C.ears.length + EAR_R).toArray();
    return rodOf(root, end);
  });

  const coat = unlitMat(paint.coat);
  const dark = unlitMat(paint.pupil);
  const horn = unlitMat(paint.horn);
  return (
    <group scale={C.size}>
      {/* The lump: body, legs, neck, head, muzzle and tail, one form. */}
      <mesh geometry={shown.body} castShadow receiveShadow material={coat} />
      <mesh geometry={shown.tail} castShadow receiveShadow material={unlitMat(paint.tail)} />
      {/* The patch over the back, and the hooves round the feet. */}
      {patch && <mesh geometry={patch} receiveShadow material={unlitMat(paint.patch)} />}
      {hooves.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={unlitMat(paint.hoof)} />)}
      {/* The hanging tail: a thin rod out and down off the rump, a
          brush of a tuft on its end — a ball drawn out downwards to a
          point — swung about the root. */}
      {C.tail.hang && (
        <group ref={hung} position={lay.hang.root}>
          <mesh castShadow material={unlitMat(paint.tail)}>
            <sphereGeometry args={[hang.r, 10, 8]} />
          </mesh>
          {[[[0, 0, 0], lay.hang.bend, hang.r, hang.r * 0.9], [lay.hang.bend, lay.hang.tip, hang.r * 0.9, hang.r * 0.75]].map(([a, b, ra, rb], i) => {
            const rod = rodOf(a, b);
            return (
              <group key={i}>
                <mesh position={rod.at} quaternion={rod.turn} castShadow material={unlitMat(paint.tail)}>
                  <cylinderGeometry args={[ra, rb, rod.length, 8]} />
                </mesh>
                <mesh position={b} castShadow material={unlitMat(paint.tail)}>
                  <sphereGeometry args={[rb, 8, 6]} />
                </mesh>
              </group>
            );
          })}
          <group position={lay.hang.tip}>
            <mesh position={[0, -hang.tuft * 0.9, 0]} scale={[1, 1.4, 1]} castShadow material={unlitMat(paint.tuft)}>
              <sphereGeometry args={[hang.tuft, 12, 10]} />
            </mesh>
            <mesh position={[0, -hang.tuft * 0.9 - hang.tuft * 1.3, 0]} rotation-x={Math.PI} castShadow material={unlitMat(paint.tuft)}>
              <coneGeometry args={[hang.tuft * 0.93, hang.tuft * 1.6, 12]} />
            </mesh>
          </group>
        </group>
      )}
      {snout && <mesh geometry={snout} receiveShadow material={unlitMat(paint.snout)} />}
      {/* The snout's nostrils: a bead either side on its end, turned
          nose-down with it. */}
      {C.snout && (
        <group position={lay.snout.end} rotation-x={lay.snout.tilt}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * lay.snout.nostrilX, 0.012, -0.002]} castShadow material={unlitMat(paint.nose)}>
              <sphereGeometry args={[lay.snout.nostrilR, 10, 8]} />
            </mesh>
          ))}
        </group>
      )}
      {/* The stripes over the body, neck, head and legs. */}
      {stripes.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={unlitMat(paint.stripe)} />)}
      {/* The mane: a row of capsules standing off the neck's back,
          withers to poll. */}
      {C.mane && lay.mane.map((m, i) => (
        <mesh key={i} position={m.at} rotation={m.turn} castShadow receiveShadow material={unlitMat(paint.mane)}>
          <capsuleGeometry args={[MANE.r, MANE.length, 4, 10]} />
        </mesh>
      ))}
      {/* The spots over the back and flanks. */}
      {spots.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={unlitMat(paint.spot)} />)}
      {/* The face, in the head's frame, nosing down with it. */}
      <group position={lay.head} rotation-x={lay.tilt}>
        {/* Horns: two tapered pieces each with a ball at the knee. */}
        {C.horns && horns.map((h, i) => (
          <group key={i}>
            <mesh position={h.lower.at} quaternion={h.lower.turn} castShadow material={horn}>
              <cylinderGeometry args={[0.024, 0.034, h.lower.length, 10]} />
            </mesh>
            <mesh position={h.knee} castShadow material={horn}>
              <sphereGeometry args={[0.024, 10, 8]} />
            </mesh>
            <mesh position={h.upper.at} quaternion={h.upper.turn} castShadow material={horn}>
              <cylinderGeometry args={[0.006, 0.024, h.upper.length, 10]} />
            </mesh>
          </group>
        ))}
        {/* Ossicones: two pegs, each with a ball on its end. */}
        {C.ossicones && ossicones.map((o, i) => (
          <group key={i}>
            <mesh position={o.peg.at} quaternion={o.peg.turn} castShadow material={unlitMat(paint.ossicone)}>
              <cylinderGeometry args={[OSSICONE.r * 0.85, OSSICONE.r, o.peg.length, 10]} />
            </mesh>
            <mesh position={o.tip} castShadow material={unlitMat(paint.knob)}>
              <sphereGeometry args={[OSSICONE.knob, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* The antlers, the second lump, standing on the head. */}
        {antlers && <mesh geometry={antlers} castShadow receiveShadow material={unlitMat(paint.antler)} />}
        {/* Ears: flattened capsules out to either side. */}
        {ears.map((e, i) => (
          <mesh key={i} position={e.at} quaternion={e.turn} scale={[1, 1, 0.45]} castShadow receiveShadow material={coat}>
            {earShape}
          </mesh>
        ))}
        {/* The beard: a cone hanging from under the chin. */}
        {C.beard && (
          <mesh position={beard.at} quaternion={beard.turn} castShadow material={coat}>
            <cylinderGeometry args={[BEARD.top, BEARD.tip, beard.length, 10]} />
          </mesh>
        )}
        {/* The nose: a dark bead on the end of the muzzle (the snout's
            nostrils are drawn on its own end, below). */}
        {!C.snout && (
          <mesh position={[0, -MUZZLE.down + 0.02, hl + MUZZLE.out - 0.012]} castShadow material={unlitMat(paint.nose)}>
            <sphereGeometry args={[0.034, 12, 8]} />
          </mesh>
        )}
        {/* Eyes: beads on the sides of the head, a dark bar lying across
            the outer face of each for a pupil when it has them (a goat's);
            without, plain round beads (a deer's). */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (hw - 0.012), EYE_Y, EYE_Z]}>
            <mesh castShadow material={unlitMat(paint.eyes)}>
              <sphereGeometry args={[EYE_R, 12, 8]} />
            </mesh>
            {C.pupils && (
              <mesh position={[s * (EYE_R - 0.003), 0, 0]} material={dark}>
                <boxGeometry args={[BAR[1], BAR[2], BAR[0]]} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}
