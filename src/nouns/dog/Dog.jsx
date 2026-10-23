import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { DOG } from "./objects.js";

// Where everything sits for each pose, at size 1: the cat's frame (see
// cat/Cat.jsx) with a dog's parts on it. The dog is one lump (see
// world/lump.js): `parts` are the forms it is poured from — ONE rounded
// block for head and body together, each leg a slimmer block pulled
// straight down out of it to the ground, the snout a smaller block out
// of the front, and the tail a run of capsules out of its rear. The face
// is drawn on the block's front: `face` is the middle of it, on the
// front surface, and `lean` how the front leans back (the eyes, snout
// and ears go with it); `ears` where the two ears hang, from `face`.
// `spots` are the round patches painted on the back and flanks, each a
// disc `d` across at `at`, projected onto the lump along its own -z
// turned `turn` (down onto the back, in from a side), `depth` deep;
// `collar` the band painted across the front under the snout the same
// way, a box thin top to bottom, as wide as the block and reaching back
// round its front corners; `tag` where the collar's tag hangs, `turn`ed
// so its disc lies right. The tail is a
// curve of `points` from where it leaves the rear to its tip, `rootR`
// thick where it leaves and `tipR` at the tip; the wag bends it from the
// root, `sway` scaling that, small when the tail lies on the ground.
// `top` is how tall the dog stands.
//
// Sitting, the chest slab (see there) runs from the front legs' tops up
// to the top of the head; the legs' tops run up into it past its
// rounded bottom edge and CHEST_EMBED beyond, their backs LEG_EMBED into
// the block, and the slab itself back to the block's middle, all so
// nothing meets at a seam.
const CHEST_EMBED = 0.03, LEG_EMBED = 0.03;
// The snout: a block out of the lower half of the face, `size` across,
// tall and deep, its edges rounded `round`, its front `out` ahead of the
// face, its middle `down` below the face's.
const SNOUT = { size: [0.26, 0.2, 0.3], round: 0.07, out: 0.17, down: 0.09 };
const EAR_R = 0.12, EAR_LENGTH = 0.26; // a floppy ear: a capsule, flattened
const EYE_X = 0.16, EYE_Y = 0.08, EYE_R = 0.045;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size, tilt = 0) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, tilt, blend: 0 });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The snout, on a face leaning back `lean`: a block run back into it
  const snout = (face, lean) => {
    const dy = -SNOUT.down, dz = SNOUT.out - SNOUT.size[2] / 2;
    return {
      kind: "box",
      at: [0, face[1] + dy * Math.cos(lean) - dz * Math.sin(lean), face[2] + dy * Math.sin(lean) + dz * Math.cos(lean)],
      half: SNOUT.size.map((s) => s / 2 - SNOUT.round),
      round: SNOUT.round,
      tilt: lean,
      blend: 0.03,
    };
  };
  if (C.pose === "sitting") {
    // The block stood on end, its base on the ground as the seat (no
    // haunches of its own), leant back a little. A CHEST slab stands on
    // its front from the tops of the front legs right up to the top of
    // the head: as wide, flush with the top, leaning with it, its front
    // S.chestDepth forward of the block's own, and run back into the
    // block so there is no seam — so the neck and face sit straight over
    // the collar, and the block's lower front, between the front legs,
    // is set back under the chest as the belly. The
    // front legs are columns from up inside the chest slab down to the
    // ground, leaning back with it so their fronts lie in its front's
    // own plane (or S.legForward proud of it) and their backs run into
    // the block's front, with a paw block at the foot of each nudged
    // forward. The
    // hind feet are flat blocks under the block's base at either side,
    // well back of the front legs under the rear of the seat, their
    // fronts S.footBack behind the base's front, turned out so the toes
    // point to the sides, and a little outboard of the front legs. The collar runs across the top of the chest
    // under the snout, its tag on the chest's front. See DOG.sitting for
    // the knobs.
    const S = C.sitting;
    const lean = -0.12;
    const sw = B.width * 0.9, sh = 0.86, sl = B.length * 0.5;
    const at = [0, sh / 2 + 0.04, -0.1];
    // Where the block's front and back faces are at a height, leaning as it does
    const frontAt = (y) => at[2] + (y - at[1]) * Math.sin(lean) + (sl / 2) * Math.cos(lean);
    const backAt = (y) => at[2] + (y - at[1]) * Math.sin(lean) - (sl / 2) * Math.cos(lean);
    // A point `dy` up and `dz` forward of the block's middle, in its own leaning frame
    const onBlock = (dy, dz) => [0, at[1] + dy * Math.cos(lean) - dz * Math.sin(lean), at[2] + dy * Math.sin(lean) + dz * Math.cos(lean)];
    // ...and `dy` up it so that the point lands at height `y` with `dz` forward
    const upTo = (y, dz) => (y - at[1] + dz * Math.sin(lean)) / Math.cos(lean);
    // The chest slab: from low over the belly — down over the top
    // quarter of the front legs — up to the block's top, from its middle
    // out past its front, its edges rounded the same as the block's so
    // the two tops and sides run as one
    const chestBottom = 0.34;
    const cd = S.chestDepth + sl / 2, cz = cd / 2; // forward of the block's middle
    const cBottom = upTo(chestBottom, sl / 2), ch = sh / 2 - cBottom, cy = (sh / 2 + cBottom) / 2; // up it
    const cr = Math.min(B.round, ch / 2 - 0.03, cd / 2 - 0.03);
    const chestFront = (y) => frontAt(y) + S.chestDepth;
    // The front legs: up into the slab past its rounded bottom edge, so
    // their fronts carry straight on up into the slab's flat front —
    // leaning with it, so the two lie in one plane and nothing bulges
    // where they meet — and their backs run LEG_EMBED into the block
    // (and never slimmer front to back than across)
    const legTop = chestBottom + cr + CHEST_EMBED;
    const legDepth = Math.max(S.chestDepth + S.legForward + LEG_EMBED, L.thickness);
    const legFrontAt = (y) => chestFront(y) + S.legForward; // where a leg's front is at a height
    const legZ = legFrontAt(legTop / 2) - legDepth / 2;
    const pawZ = legFrontAt(0.05) + 0.05 - 0.085; // the paw's front a hair proud of the leg's
    const lx = S.legSpacing / 2;
    const feet = [[-lx, 0, legZ], [lx, 0, legZ]];
    const footLen = 0.26, footZ = frontAt(0) - footLen / 2 - S.footBack, footX = sw / 2 - 0.01;
    const yaw = THREE.MathUtils.degToRad(S.footYaw);
    const top = at[1] + sh / 2;
    const face = [0, top - 0.16, chestFront(top - 0.16)];
    const collarY = face[1] - SNOUT.down - SNOUT.size[1] / 2 - 0.08; // below the snout's fillet into the face
    return {
      parts: [
        block(at, [sw, sh, sl], lean),
        { kind: "box", at: onBlock(cy, cz), half: [sw / 2 - cr, ch / 2 - cr, cd / 2 - cr], round: cr, tilt: lean, blend: 0 }, // the chest
        ...feet.map(([x, , z]) => ({ kind: "box", at: [x, legTop / 2, z], half: [L.thickness / 2 - L.round, legTop / 2 - L.round, legDepth / 2 - L.round], round: L.round, tilt: lean, blend: 0 })),
        ...feet.map(([x]) => ({ kind: "box", at: [x, 0.053, pawZ], half: [L.thickness / 2 - 0.035, 0.018, 0.05], round: 0.035, blend: 0.02 })), // the paws
        ...[-1, 1].map((side) => ({ kind: "box", at: [side * footX, 0.047, footZ], half: [0.03, 0.012, footLen / 2 - 0.035], round: 0.035, yaw: side * yaw, blend: 0.02 })), // the hind feet
        snout(face, lean),
      ],
      face,
      lean,
      ears: [sw / 2 + 0.035, -0.08, -0.2],
      // The spots: one on the back from behind, one on each flank, a
      // small one on top of the head
      spots: [
        { at: [0.08, top - 0.3, backAt(top - 0.3) - 0.1], turn: [0, Math.PI, 0], d: 0.24, depth: 0.3 },
        { at: [sw / 2 + 0.1, 0.5, -0.15], turn: [0, Math.PI / 2, 0], d: 0.22, depth: 0.3 },
        { at: [-(sw / 2 + 0.1), 0.6, -0.25], turn: [0, -Math.PI / 2, 0], d: 0.18, depth: 0.3 },
        { at: [-0.1, top + 0.1, -0.2], turn: [-Math.PI / 2, 0, 0], d: 0.16, depth: 0.3 },
      ],
      // The collar: a band across the chest's front, leaning with it, round its corners
      collar: { at: [0, collarY, chestFront(collarY) - 0.1], turn: [lean, 0, 0], size: [sw + 0.1, 0.07, 0.3] },
      tag: { at: [0, collarY - 0.075, chestFront(collarY - 0.075) + 0.02], turn: [Math.PI / 2, 0, 0] },
      tail: {
        points: [[0.1, 0.22, -0.32], [0.32, 0.1, -0.5], [0.52, 0.08, -0.22], [0.52, 0.08, -0.02]], // out the back and round to lie beside the right hind foot
        rootR: 0.08,
        tipR: 0.06,
        sway: 0.25,
      },
      top,
    };
  }
  if (C.pose === "loaf") {
    // The block low and long, flat on the ground (the cat's loaf), the
    // snout out of its front and the ears draped down its sides; two
    // paws out in front, the collar under the snout above them with
    // the tag hung between, the spots over the back and flanks, the tail laid
    // along the right side.
    const w = B.width + 0.06;
    const px = w / 2 - 0.04 - 0.01;
    const front = B.length / 2 - 0.05;
    const feet = [[-px, 0.065, front - 0.01], [px, 0.065, front - 0.01]];
    const face = [0, 0.42, front];
    const collarY = face[1] - SNOUT.down - SNOUT.size[1] / 2 - 0.05; // under the snout
    return {
      parts: [
        block([0, 0.3, -0.05], [w, 0.6, B.length]),
        ...feet.map((at) => ({ kind: "box", at, half: [0.035, 0.025, 0.07], round: 0.04, blend: 0.05 })),
        snout(face, 0),
      ],
      face,
      lean: 0,
      ears: [w / 2 + 0.035, -0.08, -0.2],
      spots: [
        { at: [0.1, 0.7, -0.15], turn: [-Math.PI / 2, 0, 0], d: 0.26, depth: 0.3 },
        { at: [w / 2 + 0.1, 0.33, -0.3], turn: [0, Math.PI / 2, 0], d: 0.2, depth: 0.3 },
        { at: [-(w / 2 + 0.1), 0.35, -0.05], turn: [0, -Math.PI / 2, 0], d: 0.18, depth: 0.3 },
        { at: [-0.15, 0.7, -0.45], turn: [-Math.PI / 2, 0, 0], d: 0.18, depth: 0.3 },
      ],
      collar: { at: [0, collarY, front - 0.1], turn: [0, 0, 0], size: [w + 0.1, 0.07, 0.3] },
      tag: { at: [0, collarY - 0.075, front + 0.02], turn: [Math.PI / 2, 0, 0] },
      tail: {
        points: [[0.1, 0.2, -0.57], [0.32, 0.09, -0.68], [0.43, 0.08, -0.35], [0.41, 0.08, 0.1], [0.3, 0.08, 0.45]],
        rootR: 0.08,
        tipR: 0.06,
        sway: 0.2,
      },
      top: 0.6,
    };
  }
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the face on its
  // front, the collar a band across the front under the snout with its
  // tag hanging off it, the tail out of the top of its rear, curling up.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = 0.55, bottom = legTop - 0.21, top = bottom + B.height;
  const face = [0, top - 0.2, B.length / 2];
  const collarY = face[1] - SNOUT.down - SNOUT.size[1] / 2 - 0.05; // under the snout
  return {
    parts: [block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length]), ...feet.map(([x, , z]) => leg(x, z, legTop)), snout(face, 0)],
    face,
    lean: 0,
    ears: [B.width / 2 + 0.035, -0.08, -0.2],
    spots: [
      { at: [0.1, top + 0.1, -0.15], turn: [-Math.PI / 2, 0, 0], d: 0.26, depth: 0.3 },
      { at: [B.width / 2 + 0.1, bottom + B.height * 0.5, -0.2], turn: [0, Math.PI / 2, 0], d: 0.22, depth: 0.3 },
      { at: [-(B.width / 2 + 0.1), bottom + B.height * 0.6, 0.2], turn: [0, -Math.PI / 2, 0], d: 0.2, depth: 0.3 },
      { at: [-0.12, top + 0.1, -0.36], turn: [-Math.PI / 2, 0, 0], d: 0.16, depth: 0.3 },
    ],
    collar: { at: [0, collarY, B.length / 2 - 0.1], turn: [0, 0, 0], size: [B.width + 0.1, 0.07, 0.3] },
    tag: { at: [0, collarY - 0.075, B.length / 2 + 0.02], turn: [Math.PI / 2, 0, 0] },
    tail: {
      points: [[0, top - 0.12, -B.length / 2 + 0.06], [0, top - 0.18, -B.length / 2 - 0.18], [0, top - 0.06, -B.length / 2 - 0.34], [0, top + 0.14, -B.length / 2 - 0.4], [0, top + 0.3, -B.length / 2 - 0.32]],
      rootR: 0.08,
      tipR: 0.06,
      sway: 1,
    },
    top,
  };
}

// How tall the dog stands off its ground: the top of its head.
export function dogHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, nose to tail along.
export function dogFootprintOf(C) {
  return { x: 0.4 * C.size, z: 1.0 * C.size };
}

// One dog, standing on the ground at y = 0 facing +z. `config` overrides
// any of DOG's fields for this one instance.
export default function Dog({ config }) {
  const C = useMemo(() => merge(DOG, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: head, body, snout, legs and tail as one, poured round the
  // pose's parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The spots, if it has them: each a disc painted on — a patch arched
  // at the top and rounded off at the bottom by half its width, so a
  // circle; and the collar, a band painted across the front under the
  // snout, if it is worn.
  const spots = useMemo(() => (C.spots ? lay.spots.map((s) => paintOn(lump.geo, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), [s.d, s.d, s.depth], { arch: true, radius: s.d / 2 })) : []), [C.spots, lump, lay.spots]);
  useEffect(() => () => spots.forEach((g) => g.dispose()), [spots]);
  const collar = useMemo(() => (C.collar ? paintOn(lump.geo, new THREE.Vector3(...lay.collar.at), new THREE.Euler(...lay.collar.turn), lay.collar.size, { lift: 0.009 }) : null), [C.collar, lump, lay.collar]);
  useEffect(() => () => collar?.dispose(), [collar]);

  // The wag: the tail bent quickly side to side about its root, each
  // vertex by its weight.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    bendTail(lump, lump.root, Math.sin(clock.current * 9) * 0.55 * C.wag * lay.tail.sway);
  });

  const coat = unlitMat(paint.coat);
  const patch = unlitMat(paint.patch);
  return (
    <group scale={C.size}>
      {/* The lump: head, body, snout, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The spots over the back and flanks, and the collar under the
          snout with its tag, a brass disc, hung off it. */}
      {spots.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={patch} />)}
      {collar && <mesh geometry={collar} receiveShadow material={unlitMat(paint.collar)} />}
      {collar && (
        <mesh position={lay.tag.at} rotation={lay.tag.turn} castShadow material={unlitMat(paint.tag)}>
          <cylinderGeometry args={[0.065, 0.065, 0.03, 12]} />
        </mesh>
      )}
      {/* The face, drawn on the block's front, leaning back with it. */}
      <group position={lay.face} rotation-x={lay.lean}>
        {/* Ears: flattened capsules hanging down the sides of the head
            from its top edge, the tops tucked into the head and the
            bottoms flared outward so they drape. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} rotation={[0.1, 0, s * 0.22]} scale={[0.45, 1, 1]} castShadow receiveShadow material={patch}>
            <capsuleGeometry args={[EAR_R, EAR_LENGTH, 4, 12]} />
          </mesh>
        ))}
        {/* The nose: a dark bead on the end of the snout. */}
        <mesh position={[0, -SNOUT.down + 0.03, SNOUT.out - 0.01]} castShadow material={unlitMat(paint.nose)}>
          <sphereGeometry args={[0.065, 12, 8]} />
        </mesh>
        {/* Eyes: dark beads either side above the snout. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * EYE_X, EYE_Y, 0.004]} castShadow material={unlitMat(paint.eyes)}>
            <sphereGeometry args={[EYE_R, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
