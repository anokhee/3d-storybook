import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { Eye } from "../../world/eye.jsx";
import { PIG } from "./objects.js";

// Where everything sits, at size 1: the dog's frame (see dog/Dog.jsx)
// with a pig's parts on it, standing only. The pig is one lump (see
// world/lump.js): `parts` are the forms it is poured from — a fat
// rounded block for the body, each leg a short block pulled straight
// down out of one of its corners to the ground, the head a smaller
// block out of the body's front with its back run well inside the body
// so the two are one, and the tail a run of capsules out of its rump.
// The face is drawn on the head block's front: `face` is the middle of
// it, on the front surface (the eyes, snout and ears go from it);
// `ears` where the two ears stand, from `face`: the middle of each
// one's base, on the top of the head. `patches` are the round
// patches painted on the back and a flank, each a disc `d` across at
// `at`, projected onto the lump along its own -z turned `turn` (down
// onto the back, in from a side), `depth` deep. The tail is a curve of
// `points` from where it leaves the rump to its tip, `rootR` thick
// where it leaves and `tipR` at the tip: a pig's is a tight spiral, so
// the points go once round a shrinking circle behind the rump, drifting
// sideways a little so the inner turn lies beside the outer rather than
// on it; the wag bends it from the root, `sway` scaling that. `top` is
// how tall the pig stands.
//
// The snout: a flat disc on the lower half of the face, SNOUT.r across,
// SNOUT.depth thick, its middle SNOUT.down below the face's, set so its
// back half is in the head and its front stands SNOUT.out ahead of the
// face; the nostrils two dots on its front, NOSTRIL apart and across.
const SNOUT = { r: 0.105, depth: 0.08, out: 0.045, down: 0.055 };
const NOSTRIL = { x: 0.035, y: 0.005, r: 0.017 };
// A floppy ear: a four-sided cone pressed flat, EAR.r at the base and
// EAR.h tall, its base EAR.sunk under the head's top, tipped forward by
// EAR.tip and rolled out by EAR.roll.
const EAR = { r: 0.13, h: 0.25, sunk: 0.03, tip: 0.85, roll: 0.2 };
const EYE_X = 0.105, EYE_Y = 0.075, EYE_R = 0.04;
// How far round the tail's spiral goes, and how much of it is the
// straight run out of the rump before the curl.
const TAIL_TURNS = 1.15, TAIL_POINTS = 8;
function layoutOf(C) {
  const B = C.body;
  const H = C.head;
  const L = C.legs;
  const block = (at, size, round, blend = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, blend });
  // A leg: a short block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // Standing: the block up on four short legs — each pulled down from
  // one of its corners, flush with the sides and the ends — the head
  // out of its front a little below the back, the tail out of the top
  // of its rump, curling.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = 0.3, bottom = legTop - 0.12, top = bottom + B.height;
  const front = B.length / 2, rump = -B.length / 2;
  // The head: its front H.length / 2 ahead of the body's, so half of it
  // is inside the body, its middle a little below the body's
  const headY = bottom + B.height * 0.5 - 0.01, headFront = front + H.length / 2;
  const face = [0, headY + 0.02, headFront];
  // The tail: out of the rump at the top, then once round a circle
  // behind it that shrinks as it goes, from the bottom up over the top
  // and back in
  const cy = top - 0.14, cz = rump - 0.11;
  const spiral = Array.from({ length: TAIL_POINTS }, (_, i) => {
    const t = i / (TAIL_POINTS - 1);
    const a = -Math.PI / 2 + t * TAIL_TURNS * 2 * Math.PI;
    const r = THREE.MathUtils.lerp(0.1, 0.05, t);
    return [0.02 + t * 0.07, cy + r * Math.sin(a), cz - r * Math.cos(a)];
  });
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      block([0, headY, headFront - H.length / 2], [H.width, H.height, H.length], H.round, H.blend),
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
    ],
    face,
    ears: [H.width / 2 - 0.08, headY + H.height / 2 - face[1] - EAR.sunk, -H.length / 2 - 0.02],
    // The patches: one on the back from above, one on the right flank
    patches: [
      { at: [-0.06, top + 0.1, -0.12], turn: [-Math.PI / 2, 0, 0], d: 0.26, depth: 0.3 },
      { at: [B.width / 2 + 0.1, bottom + B.height * 0.55, 0.1], turn: [0, Math.PI / 2, 0], d: 0.2, depth: 0.3 },
    ],
    tail: {
      points: [[0, cy - 0.1 + 0.02, rump + 0.08], ...spiral],
      rootR: 0.05,
      tipR: 0.028,
      sway: 1,
    },
    top,
  };
}

// How tall the pig stands off its ground: the top of its back.
export function pigHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// body across, snout to tail along.
export function pigFootprintOf(C) {
  return { x: 0.34 * C.size, z: 0.7 * C.size };
}

// One pig, standing on the ground at y = 0 facing +z. `config` overrides
// any of PIG's fields for this one instance.
export default function Pig({ config }) {
  const C = useMemo(() => merge(PIG, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, head, legs and tail as one, poured round the
  // layout's parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The patches, if it has them: each a disc painted on — a patch arched
  // at the top and rounded off at the bottom by half its width, so a
  // circle.
  const patches = useMemo(() => (C.patches ? lay.patches.map((s) => paintOn(lump.geo, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), [s.d, s.d, s.depth], { arch: true, radius: s.d / 2 })) : []), [C.patches, lump, lay.patches]);
  useEffect(() => () => patches.forEach((g) => g.dispose()), [patches]);

  // The wag: the tail bent quickly side to side about its root, each
  // vertex by its weight.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    bendTail(lump, lump.root, Math.sin(clock.current * 9) * 0.55 * C.wag * lay.tail.sway);
  });

  const coat = unlitMat(paint.coat);
  const snout = unlitMat(paint.snout);
  return (
    <group scale={C.size}>
      {/* The lump: body, head, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The patches over the back and flank. */}
      {patches.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={unlitMat(paint.patch)} />)}
      {/* The face, drawn on the head's front. */}
      <group position={lay.face}>
        {/* Ears: flat triangles standing on the top of the head either
            side, tipped forward and rolled out so they flop. The cone's
            middle is half its height up its own tipped axis from its base. */}
        {[-1, 1].map((s) => {
          const roll = -s * EAR.roll;
          const axis = [-Math.sin(roll), Math.cos(roll) * Math.cos(EAR.tip), Math.cos(roll) * Math.sin(EAR.tip)];
          return (
            <mesh key={s} position={[s * lay.ears[0] + axis[0] * EAR.h / 2, lay.ears[1] + axis[1] * EAR.h / 2, lay.ears[2] + axis[2] * EAR.h / 2]} rotation={[EAR.tip, 0, roll]} scale={[1, 1, 0.3]} castShadow receiveShadow material={snout}>
              <coneGeometry args={[EAR.r, EAR.h, 4]} />
            </mesh>
          );
        })}
        {/* The snout: a flat disc on the lower face, its back in the
            head, with two dark nostrils dotted on its front. */}
        <mesh position={[0, -SNOUT.down, SNOUT.out - SNOUT.depth / 2]} rotation-x={Math.PI / 2} castShadow material={snout}>
          <cylinderGeometry args={[SNOUT.r, SNOUT.r, SNOUT.depth, 24]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * NOSTRIL.x, -SNOUT.down + NOSTRIL.y, SNOUT.out]} material={unlitMat(paint.nostrils)}>
            <sphereGeometry args={[NOSTRIL.r, 10, 8]} />
          </mesh>
        ))}
        {/* Eyes: white eyeballs either side above the snout, a round
            pupil in the eye colour (world/eye.jsx). */}
        {[-1, 1].map((s) => (
          <Eye key={s} position={[s * EYE_X, EYE_Y, 0.004]} r={EYE_R} pupil={paint.eyes} />
        ))}
      </group>
    </group>
  );
}
