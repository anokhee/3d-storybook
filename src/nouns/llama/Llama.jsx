import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { Eye, AHEAD, OUT } from "../../world/eye.jsx";
import { LLAMA, ALPACA } from "./objects.js";

// Where everything sits, at size 1: the cat's frame (see cat/Cat.jsx)
// with a llama's parts on it, standing only. The llama is one lump (see
// world/lump.js): `parts` are the forms it is poured from — a rounded
// block for the body, each leg a slimmer block pulled straight down out
// of one of its corners to the ground, the neck a tall block standing
// nearly upright out of the front of the body's top (the lump's `tilt`,
// about x: forward is positive), its foot run down into the body so
// there is no seam, the head a small rounded block sat on the neck's
// top with its back flush with the neck's and facing +z, the muzzle a
// shorter block out of the head's front, and the tail a sphere or two
// out of the top of the rump. `head` is the head block's middle and
// `headTop` its top, for what stands on it: `ears` where the two ears
// stand, from the middle; `eyes` where the eyeballs sit on the head's
// sides. `muzzle` is the box the dark tip is painted within, round the
// muzzle's end — a box round the end paints it all round, like a sock.
// `patches` are the round patches painted on, each a disc `d` across at
// `at`, projected onto the lump along its own -z turned `turn` (down
// onto the back, in from a side), `depth` deep: big ones over the
// body's sides and back, a smaller one on the neck. `top` is how tall
// the llama stands, to the ears' tips.
//
// As an alpaca (see ALPACA): the neck ALPACA.neck as tall and the body
// ALPACA.body, with `wool` — spheres pressed into the body on wide
// fillets, each poking out WOOL_OUT past the surface, so the
// lump bulges round them like fleece — and a `topknot` of two spheres on
// the head, all poured into the lump too.
const LEG_EMBED = 0.12; // how far the legs run up into the body
const NECK_EMBED = 0.2; // how far the neck's foot runs down into the body
const MUZZLE = { size: [0.15, 0.13, 0.18], round: 0.05, out: 0.12, down: 0.035 }; // out of the head's front, its front `out` ahead of the face, `down` below the head's middle
const EAR = { r: 0.03, length: 0.13, apart: 0.075, back: 0.07, splay: 0.4 };
const EYE_R = 0.036; // the eyeballs, on the sides of the head
const WOOL_R = 0.13, WOOL_OUT = 0.05, WOOL_BLEND = 0.08;
function layoutOf(C) {
  const B = C.alpaca ? { ...C.body, ...ALPACA.body } : C.body;
  const L = C.legs;
  const N = C.neck;
  const H = C.head;
  const neckLength = N.length * (C.alpaca ? ALPACA.neck : 1) + NECK_EMBED; // the block's, foot and all
  const block = (at, size, round, tilt = 0, blend = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, tilt, blend });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The body: up on its legs, each pulled down from one of its corners,
  // flush with the sides and the ends
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const bottom = 0.52, legTop = bottom + LEG_EMBED, top = bottom + B.height;
  // The neck: its foot NECK_EMBED down inside the body's front top, set
  // back so its front comes up flush with the body's front, leaning
  // forward `lean`; `up` is the way it runs and `fwd` its own forward,
  // `along(t, dz)` a point `t` of its length up it and `dz` forward
  const lean = THREE.MathUtils.degToRad(N.lean);
  const up = new THREE.Vector3(0, Math.cos(lean), Math.sin(lean));
  const fwd = new THREE.Vector3(0, -Math.sin(lean), Math.cos(lean));
  const footZ = B.length / 2 - N.depth / 2 + NECK_EMBED * Math.sin(lean) - 0.02;
  const foot = new THREE.Vector3(0, top - NECK_EMBED, footZ);
  const along = (t, dz = 0) => foot.clone().addScaledVector(up, t * neckLength).addScaledVector(fwd, dz);
  const neckTop = along(1);
  // The head: on the neck's top, its back flush with the neck's back
  // and its bottom run a little down into the neck
  const neckBackTop = along(1, -N.depth / 2);
  const head = [0, neckBackTop.y + H.height / 2 - 0.06, neckBackTop.z + H.length / 2];
  const headTop = head[1] + H.height / 2;
  const headFront = head[2] + H.length / 2;
  // The muzzle: a shorter block out of the lower half of the head's
  // front, its edges rounded, run back into the head
  const muzzleY = head[1] - MUZZLE.down, muzzleFront = headFront + MUZZLE.out;
  const muzzle = { kind: "box", at: [0, muzzleY, muzzleFront - MUZZLE.size[2] / 2], half: MUZZLE.size.map((s) => s / 2 - MUZZLE.round), round: MUZZLE.round, blend: 0.03 };
  // The tail: a ball out of the top of the rump and a smaller one on
  // top of it, lifted
  const tail = [
    { kind: "sphere", at: [0, top - 0.1, -B.length / 2 - 0.02], r: 0.085, blend: 0.07 },
    { kind: "sphere", at: [0, top - 0.02, -B.length / 2 - 0.07], r: 0.065, blend: 0.05 },
  ];
  // The wool, an alpaca's: balls sunk into the body's back, sides,
  // chest and rump, each its radius less WOOL_OUT in from the surface so
  // it bulges out that far; the neck is left plain so it still reads
  const sunk = WOOL_R - WOOL_OUT;
  const wool = C.alpaca
    ? [
        ...[-0.24, 0.02, 0.28].flatMap((z, i) => [-1, 1].map((s) => ({ kind: "sphere", at: [s * (0.11 + (i % 2) * 0.02), top - sunk, z], r: WOOL_R, blend: WOOL_BLEND }))),
        ...[-0.22, 0.16].flatMap((z) => [-1, 1].map((s) => ({ kind: "sphere", at: [s * (B.width / 2 - sunk), bottom + B.height * 0.6, z], r: WOOL_R, blend: WOOL_BLEND }))),
        { kind: "sphere", at: [0, bottom + B.height * 0.55, -B.length / 2 + sunk], r: WOOL_R, blend: WOOL_BLEND },
        { kind: "sphere", at: [0, bottom + B.height * 0.5, B.length / 2 - sunk], r: WOOL_R, blend: WOOL_BLEND },
      ]
    : [];
  // The topknot, an alpaca's: a ball on top of the head and a smaller
  // one in front of it, over the brow
  const topknot = C.alpaca
    ? [
        { kind: "sphere", at: [0, headTop - 0.01, head[2] - 0.05], r: 0.1, blend: 0.05 },
        { kind: "sphere", at: [0, headTop + 0.01, head[2] + 0.06], r: 0.075, blend: 0.05 },
      ]
    : [];
  const earY = headTop - 0.03;
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
      block(along(0.5).toArray(), [N.width, neckLength, N.depth], N.round, lean, 0.05),
      block(head, [H.width, H.height, H.length], H.round, 0, 0.04),
      muzzle,
      ...tail,
      ...wool,
      ...topknot,
    ],
    head,
    headTop,
    ears: [EAR.apart + (C.alpaca ? 0.03 : 0), earY, head[2] - EAR.back],
    eyes: [H.width / 2 - 0.006, head[1] + 0.03, head[2] + 0.07],
    muzzle: { at: [0, muzzleY, muzzleFront - 0.03], size: [MUZZLE.size[0] + 0.08, MUZZLE.size[1] + 0.08, 0.06] },
    // The patches: big ones in from each side of the body and down onto
    // its back, a smaller one in from one side of the neck
    patches: [
      { at: [B.width / 2 + 0.1, bottom + B.height * 0.6, 0.12], turn: [0, Math.PI / 2, 0], d: 0.24, depth: 0.4 },
      { at: [-(B.width / 2 + 0.1), bottom + B.height * 0.55, -0.2], turn: [0, -Math.PI / 2, 0], d: 0.22, depth: 0.4 },
      { at: [0.08, top + 0.1, -0.18], turn: [-Math.PI / 2, 0, 0], d: 0.2, depth: 0.3 },
      { at: [-0.1, top + 0.1, 0.1], turn: [-Math.PI / 2, 0, 0], d: 0.16, depth: 0.3 },
      { at: [N.width / 2 + 0.1, along(0.7).y, along(0.7).z], turn: [0, Math.PI / 2, 0], d: 0.12, depth: 0.2 },
    ],
    top: earY + EAR.length / 2 + EAR.r,
    neckTop,
  };
}

// The whole llama's scale: `size`, and an alpaca a little smaller.
const scaleOf = (C) => C.size * (C.alpaca ? ALPACA.scale : 1);

// How tall the llama stands off its ground: the tips of its ears.
export function llamaHeightOf(C) {
  return layoutOf(C).top * scaleOf(C);
}

// How far out from its middle it spreads, across (x) and along (z): the
// body across, muzzle to tail along.
export function llamaFootprintOf(C) {
  return { x: 0.3 * scaleOf(C), z: 0.65 * scaleOf(C) };
}

// One llama, standing on the ground at y = 0 facing +z. `config`
// overrides any of LLAMA's fields for this one instance.
export default function Llama({ config }) {
  const C = useMemo(() => merge(LLAMA, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, legs, neck, head, muzzle, tail and, an alpaca's,
  // wool and topknot as one, poured round the parts.
  const lump = useMemo(() => lumpOf(lay.parts, { resolution: C.resolution }), [lay, C.resolution]);
  useEffect(() => () => lump.dispose(), [lump]);

  // The patches, if it has them: each a disc painted on — a patch
  // arched at the top and rounded off at the bottom by half its width,
  // so a circle; and the muzzle's tip, painted round its end.
  const patches = useMemo(() => (C.patches ? lay.patches.map((s) => paintOn(lump, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), [s.d, s.d, s.depth], { arch: true, radius: s.d / 2 })) : []), [C.patches, lump, lay.patches]);
  useEffect(() => () => patches.forEach((g) => g.dispose()), [patches]);
  const muzzle = useMemo(() => paintOn(lump, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(0, 0, 0), lay.muzzle.size), [lump, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);

  const coat = unlitMat(paint.coat);
  const patch = unlitMat(paint.patch);
  const dark = unlitMat(paint.dark);
  return (
    <group scale={scaleOf(C)}>
      {/* The lump: body, legs, neck, head, muzzle and tail, one form. */}
      <mesh geometry={lump} castShadow receiveShadow material={coat} />
      {/* The patches over the body and neck, and the muzzle's dark tip
          painted round its end. */}
      {patches.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={patch} />)}
      <mesh geometry={muzzle} receiveShadow material={dark} />
      {/* Ears: two bananas standing up off the top of the head, each a
          capsule flattened a little, its foot in the head and its tip
          splayed outward. */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} rotation={[0, 0, -s * EAR.splay]} scale={[1, 1, 0.6]} castShadow receiveShadow material={coat}>
          <capsuleGeometry args={[EAR.r, EAR.length, 4, 12]} />
        </mesh>
      ))}
      {/* Eyes: white eyeballs on either side of the head, well forward,
          looking mostly ahead and a little out, a round pupil in the eye colour
          (world/eye.jsx). */}
      {[-1, 1].map((s) => (
        <Eye key={s} position={[s * lay.eyes[0], lay.eyes[1], lay.eyes[2]]} r={EYE_R} look={[s, 0, AHEAD]} face={[s, 0, OUT]} pupil={paint.eyes} />
      ))}
    </group>
  );
}
