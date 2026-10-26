import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { Eye } from "../../world/eye.jsx";
import { COW } from "./objects.js";

// Where everything sits, at size 1: the dog's standing frame (see
// dog/Dog.jsx) with a cow's parts on it. The cow is one lump (see
// world/lump.js): `parts` are the forms it is poured from — a big
// rounded block for the body, each leg a slimmer block pulled straight
// down out of one of its corners to the ground, the head a smaller
// block out of the body's front run back into it, the muzzle a broad
// shallow block out of the head's front, and the tail a run of capsules
// out of the top of the rump. `face` is the middle of the head's front,
// on its surface; the eyes, the muzzle paint and the nostrils go from
// it. `horns` are the two tapered capsules on top of the head — a lump
// of their own, in the horn's colour — and `ears` where the two ears
// stick out of its sides. `patches` are the discs painted over the back,
// flanks and head, each `d` across at `at`, projected onto the lump
// along its own -z turned `turn` (down onto the back, in from a side),
// `depth` deep, and placed so two or three overlap into one irregular
// patch; `muzzle` the box painted round the muzzle block — every side
// of it, from a little ahead of the face so the fillet stays in the
// coat; `hooves` the boxes painted round the feet the same way;
// `strap` the band painted round the neck and `bell` where the bell
// hangs under it. `udder` is where the udder sits under the belly. The
// tail is a curve of `points` from where it leaves the rump to its tip,
// `rootR` thick where it leaves and `tipR` at the tip, and `tuft` the
// tuft on its end; the wag bends it from the root. `top` is the highest
// point, a horn's tip.
//
// The head: a block out of the body's front, `size` across, tall and
// deep, its edges rounded `round`, its middle `out` ahead of the body's
// front and `down` below the body's top (so its top sits a little lower
// than the back), filleting into the body by `blend`.
const HEAD = { size: [0.42, 0.4, 0.44], round: 0.1, out: 0.12, down: 0.28, blend: 0.04 };
// The muzzle: a broad block out of the lower half of the face, `size`
// across, tall and deep, its edges rounded `round`, its front `out`
// ahead of the face, its middle `down` below the face's; painted pink
// from `from` ahead of the face outwards.
const MUZZLE = { size: [0.36, 0.22, 0.2], round: 0.06, out: 0.12, down: 0.08, from: 0.03 };
const EYE_X = 0.13, EYE_Y = 0.1, EYE_R = 0.048;
const NOSTRIL_X = 0.075, NOSTRIL_R = 0.022;
// A horn: a tapered capsule from `x` in from the head's middle on its
// top, up `rise` and out `spread` to the tip, `rootR` thick at the base
// and `tipR` at the tip, a little in from the head's back.
const HORN = { x: 0.1, spread: 0.09, rise: 0.13, rootR: 0.045, tipR: 0.025 };
// An ear: a capsule flattened front to back, pointing out and drooping
const EAR = { r: 0.065, length: 0.12, droop: 0.29, flat: 0.45 };
const TUFT_R = 0.065;
// The udder: a ball pressed up into the belly, wider than it is tall,
// `back` behind the body's middle, with four teats hanging off it.
const UDDER = { r: 0.13, scale: [1.15, 0.75, 1], back: 0.18, teatR: 0.015, teatLength: 0.03, teatSpread: [0.05, 0.05] };
// The bell: a flared cup hung under the neck on a `strap` band, a clapper in it
const BELL = { rTop: 0.03, rBottom: 0.052, height: 0.075, clapperR: 0.016, strap: 0.06 };
const HOOF_H = 0.09;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size, round, blend = 0) => ({ kind: "box", at, half: size.map((s) => s / 2 - round), round, blend });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The block up on four legs — each pulled down from one of its
  // corners, flush with the sides and the ends
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, lz], [lx, lz], [-lx, -lz], [lx, -lz]];
  const legTop = 0.6, bottom = legTop - 0.2, top = bottom + B.height;
  const front = B.length / 2, rear = -B.length / 2;
  // The head, out of the front; the face its front
  const headY = top - HEAD.down, headZ = front + HEAD.out;
  const headTop = headY + HEAD.size[1] / 2, headBottom = headY - HEAD.size[1] / 2, headFront = headZ + HEAD.size[2] / 2;
  const face = [0, headY, headFront];
  const muzzleY = headY - MUZZLE.down;
  const neckZ = front + 0.1; // under the head, clear of where it fillets into the body
  // Onto the back from above, in from the right and the left
  const DOWN = [-Math.PI / 2, 0, 0], RIGHT = [0, Math.PI / 2, 0], LEFT = [0, -Math.PI / 2, 0];
  const flank = B.width / 2 + 0.15, cheek = HEAD.size[0] / 2 + 0.1;
  const tail = {
    points: [[0, top - 0.14, rear + 0.05], [0, top - 0.17, rear - 0.1], [0, top - 0.3, rear - 0.15], [0, 0.52, rear - 0.13], [0, 0.4, rear - 0.09]],
    rootR: 0.055,
    tipR: 0.04,
  };
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      ...feet.map(([x, z]) => leg(x, z, legTop)),
      block([0, headY, headZ], HEAD.size, HEAD.round, HEAD.blend),
      block([0, muzzleY, headFront + MUZZLE.out - MUZZLE.size[2] / 2], MUZZLE.size, MUZZLE.round, 0.03),
    ],
    face,
    horns: [-1, 1].map((s) => ({ kind: "capsule", a: [s * HORN.x, headTop - 0.03, headZ - 0.05], b: [s * (HORN.x + HORN.spread), headTop - 0.03 + HORN.rise, headZ - 0.05], ra: HORN.rootR, rb: HORN.tipR })),
    ears: [HEAD.size[0] / 2 + 0.07, headY + 0.1, headZ - 0.02],
    // The patches: three discs down the right flank, two on the left,
    // three over the back (one spilling down the left of the rump), and
    // two on the left of the head round the eye and the ear
    patches: [
      { at: [flank, bottom + B.height * 0.55, -0.08], turn: RIGHT, d: 0.34, depth: 0.4 },
      { at: [flank, bottom + B.height * 0.75, 0.16], turn: RIGHT, d: 0.24, depth: 0.4 },
      { at: [flank, bottom + B.height * 0.4, -0.3], turn: RIGHT, d: 0.24, depth: 0.4 },
      { at: [-flank, bottom + B.height * 0.6, 0.18], turn: LEFT, d: 0.3, depth: 0.4 },
      { at: [-flank, bottom + B.height * 0.4, -0.02], turn: LEFT, d: 0.24, depth: 0.4 },
      { at: [-0.1, top + 0.05, -0.28], turn: DOWN, d: 0.32, depth: 0.4 },
      { at: [-0.22, top + 0.05, -0.12], turn: DOWN, d: 0.22, depth: 0.4 },
      { at: [0.12, top + 0.05, 0.2], turn: DOWN, d: 0.22, depth: 0.4 },
      { at: [-cheek, headY + 0.08, headZ - 0.04], turn: LEFT, d: 0.2, depth: 0.3 },
      { at: [-cheek, headY, headZ + 0.1], turn: LEFT, d: 0.16, depth: 0.3 },
    ],
    // The muzzle paint: a box round the muzzle block from MUZZLE.from
    // ahead of the face to past its front
    muzzle: { at: [0, muzzleY, headFront + (MUZZLE.from + MUZZLE.out + 0.04) / 2], size: [MUZZLE.size[0] + 0.04, MUZZLE.size[1] + 0.04, MUZZLE.out + 0.04 - MUZZLE.from] },
    hooves: feet.map(([x, z]) => ({ at: [x, HOOF_H / 2, z], size: [L.thickness + 0.04, HOOF_H, L.thickness + 0.04] })),
    // The strap: a thin ring round the neck, wider and taller than the head
    strap: { at: [0, headY - 0.02, neckZ], size: [HEAD.size[0] + 0.3, HEAD.size[1] + 0.3, BELL.strap] },
    bell: [0, headBottom - BELL.height / 2 + 0.01, neckZ],
    udder: [0, bottom + 0.02, -UDDER.back],
    tail,
    tuft: tail.points[tail.points.length - 1],
    top: headTop - 0.03 + HORN.rise + HORN.tipR,
  };
}

// How tall the cow stands off its ground: the tips of its horns.
export function cowHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, nose to tail along.
export function cowFootprintOf(C) {
  return { x: 0.4 * C.size, z: 0.9 * C.size };
}

const Y = new THREE.Vector3(0, 1, 0);
const tv = new THREE.Vector3();

// One cow, standing on the ground at y = 0 facing +z. `config` overrides
// any of COW's fields for this one instance.
export default function Cow({ config }) {
  const C = useMemo(() => merge(COW, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, legs, head, muzzle and tail as one, poured round the
  // pose's parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend. The horns are a
  // small lump of their own, so they can be the horn's colour.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);
  const horns = useMemo(() => lumpOf(lay.horns, { resolution: C.resolution }), [lay, C.resolution]);
  useEffect(() => () => horns.dispose(), [horns]);

  // The paint: the patches, if it has them, each a disc painted on — a
  // patch arched at the top and rounded off at the bottom by half its
  // width, so a circle; the muzzle and the hooves, boxes round them;
  // and the strap, a band round the neck over the patches, if it is worn.
  const disc = (s) => paintOn(lump.geo, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), [s.d, s.d, s.depth], { arch: true, radius: s.d / 2 });
  const box = (b, opts) => paintOn(lump.geo, new THREE.Vector3(...b.at), new THREE.Euler(), b.size, opts);
  const patches = useMemo(() => (C.patches ? lay.patches.map(disc) : []), [C.patches, lump, lay.patches]);
  useEffect(() => () => patches.forEach((g) => g.dispose()), [patches]);
  const muzzle = useMemo(() => box(lay.muzzle), [lump, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);
  const hooves = useMemo(() => lay.hooves.map((h) => box(h)), [lump, lay.hooves]);
  useEffect(() => () => hooves.forEach((g) => g.dispose()), [hooves]);
  const strap = useMemo(() => (C.bell ? box(lay.strap, { lift: 0.009 }) : null), [C.bell, lump, lay.strap]);
  useEffect(() => () => strap?.dispose(), [strap]);

  // The wag: the tail swung slowly side to side about its root, each
  // vertex by its weight; the tuft, its own mesh, carried round with the
  // tip.
  const clock = useRef(0);
  const tuft = useRef();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.5) * 0.6 * C.wag;
    bendTail(lump, lump.root, angle);
    if (tuft.current) tuft.current.position.copy(tv.set(...lay.tuft).sub(lump.root).applyAxisAngle(Y, angle).add(lump.root));
  });

  const coat = unlitMat(paint.coat);
  const patch = unlitMat(paint.patch);
  const pink = unlitMat(paint.pink);
  return (
    <group scale={C.size}>
      {/* The lump: body, legs, head, muzzle and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The patches over the back, flanks and head; the pink muzzle;
          the dark hooves; and the strap round the neck with its bell
          hung under. */}
      {patches.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={patch} />)}
      <mesh geometry={muzzle} receiveShadow material={pink} />
      {hooves.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={unlitMat(paint.hoof)} />)}
      {strap && <mesh geometry={strap} receiveShadow material={unlitMat(paint.strap)} />}
      {strap && (
        <group position={lay.bell}>
          <mesh castShadow material={unlitMat(paint.bell)}>
            <cylinderGeometry args={[BELL.rTop, BELL.rBottom, BELL.height, 14]} />
          </mesh>
          <mesh position={[0, -BELL.height / 2, 0]} castShadow material={unlitMat(paint.nostrils)}>
            <sphereGeometry args={[BELL.clapperR, 10, 8]} />
          </mesh>
        </group>
      )}
      {/* The horns: a lump of their own on top of the head. */}
      <mesh geometry={horns} castShadow receiveShadow material={unlitMat(paint.horn)} />
      {/* Ears: flattened capsules out of the sides of the head, pointing
          out and drooping, their inner ends tucked into the head. */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} rotation={[0, 0, -s * (Math.PI / 2 + EAR.droop)]} scale={[1, 1, EAR.flat]} castShadow receiveShadow material={coat}>
          <capsuleGeometry args={[EAR.r, EAR.length, 4, 12]} />
        </mesh>
      ))}
      {/* The face, drawn on the head's front. */}
      <group position={lay.face}>
        {/* Eyes: white eyeballs either side above the muzzle, a round
            pupil in the eye colour (world/eye.jsx). */}
        {[-1, 1].map((s) => (
          <Eye key={s} position={[s * EYE_X, EYE_Y, -0.01]} r={EYE_R} pupil={paint.eyes} />
        ))}
        {/* Nostrils: two small dark beads on the muzzle's front. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * NOSTRIL_X, -MUZZLE.down - 0.02, MUZZLE.out - 0.008]} castShadow material={unlitMat(paint.nostrils)}>
            <sphereGeometry args={[NOSTRIL_R, 10, 8]} />
          </mesh>
        ))}
      </group>
      {/* The udder: a pink ball pressed up into the belly towards the
          rear, four teats hanging off it. */}
      <group position={lay.udder}>
        <mesh scale={UDDER.scale} castShadow receiveShadow material={pink}>
          <sphereGeometry args={[UDDER.r, 16, 12]} />
        </mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
          <mesh key={`${sx}${sz}`} position={[sx * UDDER.teatSpread[0], -UDDER.r * UDDER.scale[1] * 0.85, sz * UDDER.teatSpread[1]]} castShadow material={pink}>
            <capsuleGeometry args={[UDDER.teatR, UDDER.teatLength, 3, 8]} />
          </mesh>
        ))}
      </group>
      {/* The tuft on the tail's tip, carried round with the wag. */}
      <mesh ref={tuft} position={lay.tuft} scale={[1, 1.3, 1]} castShadow material={patch}>
        <sphereGeometry args={[TUFT_R, 12, 10]} />
      </mesh>
    </group>
  );
}
