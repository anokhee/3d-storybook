import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { Eye } from "../../world/eye.jsx";
import { SHEEP } from "./objects.js";

// Where everything sits, at size 1, standing. The sheep is TWO lumps
// (see world/lump.js), one over the other — and a third, small one for
// the horns if it has them. `fleece` are the forms the
// woolly lump is poured from: one big rounded block for the fleece,
// `bulges` — balls pressed into its sides, top, chest and rump, each
// standing `bulge` out of it and filleted wide into it, so it reads as
// wool rather than a box — and a topknot of two more on top of the head.
// `body` are the dark lump's: a smaller block hidden inside the fleece
// for the legs and head to grow from, a head block out of the fleece's
// front, four slim legs pulled straight down out of the block to the
// ground, and the tail a run of capsules out of the rump. The face is
// on the head block's front: `face` is the middle of it, on the front
// surface; `ears` where the two ears stick out from, from `face`;
// `muzzle` the lighter patch painted on the lower face, projected onto
// the lump from in front. The tail is a curve of `points` from where it
// leaves the rump to its tip, `rootR` thick where it leaves and `tipR`
// at the tip; the wag bends it from the root. `horns`, if it has them,
// are a curve each: see hornOf. `top` is how tall the sheep stands.
//
// The head: a block out of the fleece's front, `size` across, tall and
// deep, its edges rounded `round`, its middle `out` ahead of the
// fleece's front and `up` from the ground.
const HEAD = { size: [0.28, 0.3, 0.36], round: 0.08, out: 0.16, up: 0.66 };
const EAR_R = 0.055, EAR_LENGTH = 0.16; // an ear: a capsule, flattened, out to the side
const EYE_X = 0.1, EYE_Y = 0.06, EYE_R = 0.048;
// A horn: a curve wound round the ear's side of the head, the way a
// ram's spirals — from its root up inside the top of the head, out and
// back over the ear, down behind it, forward under it and up again in
// front, the tip pointing forward beside the cheek — `rootR` thick at
// the root and `tipR` at the tip. The spiral is a circle of `R` in the
// side's own plane round a middle `out` from the head's side, `up` from
// the face's middle and `back` behind its front — ahead of the fleece,
// so the whole ring shows — shrinking by `shrink` as it goes round from
// angle `from` (0 is straight up, turning backward) to `to`, and
// stepping outward from inside the head to `out` over the first part of
// the turn.
const HORN = { R: 0.14, shrink: 0.04, out: 0.21, up: -0.02, back: 0.12, from: -0.2, to: Math.PI * 1.8, rootR: 0.07, tipR: 0.03 };
function hornOf(side, face) {
  const at = [side * HORN.out, face[1] + HORN.up, face[2] - HORN.back];
  const points = [];
  for (let k = 0; k <= 8; k++) {
    const u = k / 8;
    const a = THREE.MathUtils.lerp(HORN.from, HORN.to, u);
    const r = HORN.R - HORN.shrink * u;
    const x = THREE.MathUtils.lerp(HEAD.size[0] / 2 - 0.02, HORN.out, Math.min(1, u * 3));
    points.push([side * x, at[1] + r * Math.cos(a), at[2] - r * Math.sin(a)]);
  }
  return { points, rootR: HORN.rootR, tipR: HORN.tipR };
}
function layoutOf(C) {
  const F = C.fleece;
  const L = C.legs;
  const block = (at, size, round) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, blend: 0 });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The fleece block: up off the ground on the legs, its front a little
  // ahead of its middle so the head has somewhere to come out of
  const fleeceAt = [0, 0.33 + F.height / 2, -0.04];
  const top = fleeceAt[1] + F.height / 2;
  const fw = F.width / 2, fl = F.length / 2, front = fleeceAt[2] + fl, back = fleeceAt[2] - fl;
  // A ball pressed into the fleece at `at`, sunk so it stands `bulge`
  // proud of the block's face it is on
  const b = F.bulge;
  const ball = (at, r) => ({ kind: "sphere", at, r, blend: F.blend });
  const bulges = [
    // down the sides, three a side, staggered
    ...[-1, 1].flatMap((s) => [
      ball([s * (fw - 0.15 + b), fleeceAt[1] + 0.06, fleeceAt[2] + fl * 0.55], 0.15),
      ball([s * (fw - 0.16 + b), fleeceAt[1] - 0.06, fleeceAt[2] - fl * 0.1], 0.16),
      ball([s * (fw - 0.14 + b), fleeceAt[1] + 0.08, fleeceAt[2] - fl * 0.7], 0.14),
    ]),
    // over the back
    ball([0.1, top - 0.16 + b, fleeceAt[2] + fl * 0.25], 0.16),
    ball([-0.12, top - 0.17 + b, fleeceAt[2] - fl * 0.4], 0.17),
    ball([0.04, top - 0.13 + b, fleeceAt[2] - fl * 0.85], 0.13),
    // the rump and the chest
    ball([0.1, fleeceAt[1] - 0.04, back + 0.15 - b], 0.15),
    ball([-0.1, fleeceAt[1] + 0.07, back + 0.14 - b], 0.14),
    ball([0, fleeceAt[1] - 0.08, front - 0.16 + b], 0.16),
  ];
  // The head: out of the fleece's front, high up, its rear run back
  // into the fleece and the dark block so nothing meets at a seam
  const headAt = [0, HEAD.up, front + HEAD.out - HEAD.size[2] / 2 + 0.1];
  const face = [0, HEAD.up, headAt[2] + HEAD.size[2] / 2];
  // The topknot: two balls on top of the head, the rear one run back
  // into the fleece's front
  const topknot = [ball([0, HEAD.up + HEAD.size[1] / 2 + 0.01, headAt[2] - 0.06], 0.12), ball([0.05, HEAD.up + HEAD.size[1] / 2 - 0.01, headAt[2] + 0.07], 0.1)];
  // The dark block inside the fleece, and the legs down from its
  // corners, their tops up inside it
  const bw = F.width - 0.16, bh = F.height - 0.14, bl = F.length - 0.08;
  const bodyAt = [0, fleeceAt[1] - 0.04, fleeceAt[2]];
  const lx = bw / 2 - L.thickness / 2 - 0.01, lz = bl / 2 - L.thickness / 2 - 0.02;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = bodyAt[1] + 0.02;
  return {
    fleece: [block(fleeceAt, [F.width, F.height, F.length], F.round), ...bulges, ...topknot],
    body: [
      block(bodyAt, [bw, bh, bl], 0.1),
      { ...block(headAt, HEAD.size, HEAD.round), blend: 0.05 },
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
    ],
    face,
    ears: [HEAD.size[0] / 2 - 0.03, -0.02, -0.05],
    muzzle: { at: [0, face[1] - 0.07, face[2] + 0.02], turn: [0, 0, 0], size: [0.18, 0.15, 0.2] },
    tail: {
      points: [[0, bodyAt[1] + 0.08, back + 0.1], [0, bodyAt[1] + 0.04, back - 0.08], [0, bodyAt[1] - 0.06, back - 0.13], [0, bodyAt[1] - 0.16, back - 0.12]], // out the rump and hanging down
      rootR: 0.055,
      tipR: 0.035,
      sway: 1,
    },
    horns: [-1, 1].map((s) => hornOf(s, face)),
    top: top + b,
  };
}

// How tall the sheep stands off its ground: the top of its back.
export function sheepHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, nose to tail along.
export function sheepFootprintOf(C) {
  return { x: 0.36 * C.size, z: 0.7 * C.size };
}

// One sheep, standing on the ground at y = 0 facing +z. `config`
// overrides any of SHEEP's fields for this one instance.
export default function Sheep({ config }) {
  const C = useMemo(() => merge(SHEEP, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The fleece: the woolly lump, poured round the block, its bulges and
  // the topknot.
  const fleece = useMemo(() => lumpOf(lay.fleece, { resolution: C.resolution }), [lay, C.resolution]);
  useEffect(() => () => fleece.dispose(), [fleece]);

  // The body: the dark lump, block, head, legs and tail as one; with a
  // copy of where every vertex rests, and which are tail, for the wag
  // to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const body = useMemo(() => {
    const geo = lumpOf([...lay.body, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => body.geo.dispose(), [body]);

  // The horns, if it has them: a third lump, each horn a run of
  // capsules down its own spiral.
  const horns = useMemo(() => (C.horns ? lumpOf(lay.horns.flatMap((h) => tailParts(tailBalls(h))), { resolution: C.resolution }) : null), [C.horns, lay, C.resolution]);
  useEffect(() => () => horns?.dispose(), [horns]);

  // The muzzle: a lighter patch painted on the lower face, arched at the
  // top and its bottom corners rounded off.
  const muzzle = useMemo(() => paintOn(body.geo, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(...lay.muzzle.turn), lay.muzzle.size, { arch: true, radius: 0.05 }), [body, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);

  // The wag: the tail bent quickly side to side about its root, each
  // vertex by its weight.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    bendTail(body, body.root, Math.sin(clock.current * 9) * 0.55 * C.wag * lay.tail.sway);
  });

  const dark = unlitMat(paint.body);
  return (
    <group scale={C.size}>
      {/* The fleece, one woolly form, and the dark body under it: head,
          legs and tail, one form. */}
      <mesh geometry={fleece} castShadow receiveShadow material={unlitMat(paint.fleece)} />
      <mesh geometry={body.geo} castShadow receiveShadow material={dark} />
      {horns && <mesh geometry={horns} castShadow receiveShadow material={unlitMat(paint.horn)} />}
      <mesh geometry={muzzle} receiveShadow material={unlitMat(paint.muzzle)} />
      {/* The face, on the head block's front. */}
      <group position={lay.face}>
        {/* Ears: flattened capsules out to either side of the head, the
            roots tucked into it, drooping a little. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (lay.ears[0] + EAR_LENGTH / 2), lay.ears[1], lay.ears[2]]} rotation={[0, 0, s * (Math.PI / 2 - 0.45)]} scale={[1, 1, 0.5]} castShadow receiveShadow material={dark}>
            <capsuleGeometry args={[EAR_R, EAR_LENGTH, 4, 12]} />
          </mesh>
        ))}
        {/* Eyes: white eyeballs either side of the face with a dark
            pupil on the front of each (world/eye.jsx). */}
        {[-1, 1].map((s) => (
          <Eye key={s} position={[s * EYE_X, EYE_Y, 0.004]} r={EYE_R} pupil={paint.pupil} />
        ))}
      </group>
    </group>
  );
}
