import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { BEAR } from "./objects.js";

// Where everything sits, at size 1: the cat's standing frame (see
// cat/Cat.jsx) grown into a bear. The bear is one lump (see
// world/lump.js): `parts` are the forms it is poured from — a big
// rounded block for the body with a ball pressed into the top of its
// front, blended wide, for the hump of the shoulders; each leg a thick
// block pulled straight down out of one of the block's corners to the
// ground with a wider, flatter block of a paw at its foot; a broad
// round block of a head out of the body's front, run back into it so
// there is no seam, with the muzzle a smaller block out of the head's
// front; and the tail a stub of a capsule out of the top of the rear.
// The face is drawn on the head's front: `face` is the middle of it, on
// the front surface; `ears` where the two ears sit, from `face`.
// `muzzle` is the lighter patch painted over the muzzle's front, a disc
// `d` across at `at`, projected onto the lump along -z, `depth` deep —
// round the muzzle's front corners but short of the head's own front.
// `top` is how tall the bear stands, to the top of its hump.
//
// The muzzle: a block out of the lower half of the face, `size` across,
// tall and deep, its edges rounded `round`, its front `out` ahead of the
// face, its middle `down` below the face's.
const MUZZLE = { size: [0.3, 0.22, 0.28], round: 0.08, out: 0.15, down: 0.07 };
const HEAD = { size: [0.5, 0.42, 0.44], round: 0.14, into: 0.14 }; // the head block, run `into` the body
const EAR_R = 0.1; // a round ear: a sphere, flattened front to back and a little top to bottom
const EYE_X = 0.12, EYE_Y = 0.1, EYE_R = 0.04;
const NOSE_R = 0.07;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size, round) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, blend: 0 });
  // A leg: a thick block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // A paw: a wider, flatter block round the foot of a leg, nudged
  // forward so the toes stand proud of the leg's front.
  const pawH = 0.14, pawRound = 0.05;
  const paw = (x, z) => ({ kind: "box", at: [x, pawH / 2, z + 0.02], half: [L.paw / 2 - pawRound, pawH / 2 - pawRound, L.paw / 2 - pawRound], round: pawRound, blend: 0.04 });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the hump on its
  // top front, the head out of its front and the tail out of its rear.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = 0.46, bottom = legTop - 0.18, bodyTop = bottom + B.height;
  const front = B.length / 2;
  const hump = { at: [0, bodyTop - B.hump / 2, front - B.hump - 0.02], r: B.hump };
  const top = hump.at[1] + hump.r;
  // The head: its back HEAD.into inside the body's front, its middle a
  // little below the body's top so the hump rises behind it
  const headY = bodyTop - HEAD.size[1] / 2 + 0.02, headZ = front - HEAD.into + HEAD.size[2] / 2;
  const headFront = headZ + HEAD.size[2] / 2, headTop = headY + HEAD.size[1] / 2;
  const face = [0, headY + 0.02, headFront];
  const muzzleFront = headFront + MUZZLE.out;
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      { kind: "sphere", ...hump, blend: 0.3 },
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
      ...feet.map(([x, , z]) => paw(x, z)),
      { ...block([0, headY, headZ], HEAD.size, HEAD.round), blend: 0.08 },
      { ...block([0, face[1] - MUZZLE.down, muzzleFront - MUZZLE.size[2] / 2], MUZZLE.size, MUZZLE.round), blend: 0.03 },
      { kind: "capsule", a: [0, bodyTop - 0.14, -front + 0.04], b: [0, bodyTop - 0.1, -front - 0.1], ra: 0.075, rb: 0.06, blend: 0.06 }, // the tail
    ],
    face,
    ears: [0.18, headTop - face[1] - 0.015, -0.16],
    muzzle: { at: [0, face[1] - MUZZLE.down + 0.01, muzzleFront + 0.02], d: 0.26, depth: 0.24 },
    top,
  };
}

// How tall the bear stands off its ground: the top of its hump.
export function bearHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// body across, nose to tail along.
export function bearFootprintOf(C) {
  return { x: 0.36 * C.size, z: 0.75 * C.size };
}

// One bear, standing on the ground at y = 0 facing +z. `config` overrides
// any of BEAR's fields for this one instance.
export default function Bear({ config }) {
  const C = useMemo(() => merge(BEAR, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, hump, legs, paws, head, muzzle and tail as one,
  // poured round the parts.
  const lump = useMemo(() => lumpOf(lay.parts, { resolution: C.resolution }), [lay, C.resolution]);
  useEffect(() => () => lump.dispose(), [lump]);

  // The muzzle's lighter front, painted on: a disc — a patch arched at
  // the top and rounded off at the bottom by half its width, so a circle.
  const muzzle = useMemo(() => paintOn(lump, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(0, 0, 0), [lay.muzzle.d, lay.muzzle.d, lay.muzzle.depth], { arch: true, radius: lay.muzzle.d / 2 }), [lump, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);

  const coat = unlitMat(paint.coat);
  return (
    <group scale={C.size}>
      {/* The lump: body, legs, head, muzzle and tail, one form. */}
      <mesh geometry={lump} castShadow receiveShadow material={coat} />
      {/* The lighter muzzle, painted over the muzzle's front. */}
      <mesh geometry={muzzle} receiveShadow material={unlitMat(paint.muzzle)} />
      {/* The face, drawn on the head's front. */}
      <group position={lay.face}>
        {/* Ears: small round spheres sat on top of the head, flattened
            front to back, a little apart. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} scale={[C.ears, C.ears * 0.8, C.ears * 0.6]} castShadow receiveShadow material={coat}>
            <sphereGeometry args={[EAR_R, 12, 10]} />
          </mesh>
        ))}
        {/* The nose: a big dark bead on the end of the muzzle. */}
        <mesh position={[0, -MUZZLE.down + 0.04, MUZZLE.out - 0.01]} castShadow material={unlitMat(paint.nose)}>
          <sphereGeometry args={[NOSE_R, 12, 8]} />
        </mesh>
        {/* Eyes: small dark beads either side above the muzzle. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * EYE_X, EYE_Y, 0.004]} castShadow material={unlitMat(paint.eyes)}>
            <sphereGeometry args={[EYE_R, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
