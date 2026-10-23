import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { DONKEY } from "./objects.js";

// Where everything sits, at size 1: the cat's frame (see cat/Cat.jsx)
// with a donkey's parts on it, standing only. The donkey is one lump
// (see world/lump.js): `parts` are the forms it is poured from — a
// rounded block for the body, each leg a slimmer block pulled straight
// down out of one of its corners to the ground, the neck a block rising
// out of the front of the body's top and leaning well forward (the
// lump's `tilt`, about x: forward is positive), its foot run down into
// the body so there is no seam, the head a long rounded block on the
// neck's top pointing forward and dipped a little (a positive tilt
// drops its front), its back run down into the neck, and the tail a
// run of capsules out of the rump. `head` is the head block's middle
// and `dip` how far it points down: the ears, eyes and nostrils are
// placed in its own frame, turned with it. `ears` is where the two
// ears stand, from the head's middle, `splay` how far out each leans;
// `eyes` where the beads sit on the head's sides and `nostrils` where
// two smaller ones sit on the muzzle's front. `muzzle` is the box the
// pale muzzle is painted within, round the head's front end — a box
// round the end paints it all round, like a sock — `belly` the box the
// pale belly is painted within from underneath, and `hooves` the same
// round each foot; `stripes` the dark lines painted down the back and
// across the shoulders, each a thin box projected down onto it. `mane`
// is where the mane lies along the top of the neck, leaning with it.
// The tail is a curve of `points` from where it leaves the rump to its
// tip, `rootR` thick where it leaves and `tipR` at the tip, hanging
// down; `tuft` where the dark tuft hangs off its tip. `top` is how tall
// the donkey stands, to the ear tips.
const LEG_EMBED = 0.15; // how far the legs run up into the body
const NECK_EMBED = 0.2; // how far the neck's foot runs down into the body
const HEAD_EMBED = 0.12; // how far the head's back runs down into the neck
const EAR_R = 0.06, EAR_SINK = 0.04; // an ear: a capsule, flattened; its root sunk into the head
const EYE_R = 0.035, NOSTRIL_R = 0.018;
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const N = C.neck;
  const H = C.head;
  const E = C.ears;
  const block = (at, size, round, tilt = 0, blend = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, tilt, blend });
  // A leg: a slim block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // The body: up on its legs, each pulled down from one of its corners,
  // flush with the sides and the ends
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const bottom = 0.42, legTop = bottom + LEG_EMBED, top = bottom + B.height;
  // The neck: its foot NECK_EMBED down inside the body's front top, set
  // back so its front comes up through the body's top flush with the
  // body's front, leaning forward `lean`; `up` is the way it runs and
  // `fwd` its own forward, `along(t, dz)` a point `t` of its length up
  // it and `dz` forward
  const lean = THREE.MathUtils.degToRad(N.lean);
  const up = new THREE.Vector3(0, Math.cos(lean), Math.sin(lean));
  const fwd = new THREE.Vector3(0, -Math.sin(lean), Math.cos(lean));
  const foot = new THREE.Vector3(0, top - NECK_EMBED, B.length / 2 - NECK_EMBED * Math.tan(lean) - (N.depth / 2) * Math.cos(lean));
  const along = (t, dz = 0) => foot.clone().addScaledVector(up, t * N.length).addScaledVector(fwd, dz);
  const neckTop = along(1);
  // The head: dipped `dip` below level, its back end HEAD_EMBED down
  // into the neck's top so its back comes off flush with the neck's;
  // `headFwd` is the way it points and `headUp` its own up, `onHead(p)`
  // a point in its frame put in the world
  const dip = THREE.MathUtils.degToRad(H.dip);
  const headFwd = new THREE.Vector3(0, -Math.sin(dip), Math.cos(dip));
  const headUp = new THREE.Vector3(0, Math.cos(dip), Math.sin(dip));
  const head = neckTop.clone().addScaledVector(headFwd, H.length / 2 - HEAD_EMBED).addScaledVector(headUp, 0.02);
  const onHead = (p) => head.clone().addScaledVector(headUp, p[1]).addScaledVector(headFwd, p[2]).setX(p[0]).toArray();
  // The ears: standing on the back of the head's top, each leaning out
  // `splay`, its root sunk EAR_SINK into the head; `earUp` is the way
  // the right one runs (the left mirrors it), and the tip of either is
  // how tall the donkey stands
  const splay = THREE.MathUtils.degToRad(E.splay);
  const earRoot = [0.07, H.height / 2, -H.length / 2 + 0.11];
  const earUp = new THREE.Vector3(Math.sin(splay), Math.cos(splay), 0);
  const earReach = E.length / 2 + EAR_R; // middle to either end
  const earAt = [earRoot[0] + earUp.x * (earReach - EAR_SINK), earRoot[1] + earUp.y * (earReach - EAR_SINK), earRoot[2]];
  const earTip = onHead([earRoot[0] + earUp.x * (2 * earReach - EAR_SINK), earRoot[1] + earUp.y * (2 * earReach - EAR_SINK), earRoot[2]]);
  // The mane: along the top of the neck from where it leaves the body
  // to just short of the ears, leaning with the neck, sunk a little in
  const maneFrom = 0.3, maneTo = 1.12;
  const mane = { at: along((maneFrom + maneTo) / 2, -N.depth / 2 - 0.005).toArray(), length: (maneTo - maneFrom) * N.length, lean };
  const tailRoot = -B.length / 2 + 0.06;
  return {
    parts: [
      block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round),
      ...feet.map(([x, , z]) => leg(x, z, legTop)),
      block(along(0.5).toArray(), [N.width, N.length, N.depth], N.round, lean, 0.05),
      block(head.toArray(), [H.width, H.height, H.length], H.round, dip, 0.04),
    ],
    head: head.toArray(),
    dip,
    ears: { at: earAt, splay },
    eyes: [H.width / 2 - 0.008, 0.04, 0.02],
    nostrils: [0.045, -0.035, H.length / 2 - 0.004],
    muzzle: { at: onHead([0, -0.01, H.length / 2 - 0.05]), turn: [dip, 0, 0], size: [H.width + 0.12, H.height + 0.12, 0.13] },
    belly: { at: [0, bottom + 0.01, 0], turn: [Math.PI / 2, 0, 0], size: [B.width - 0.26, B.length - 0.3, 0.1] },
    hooves: feet.map(([x, , z]) => ({ at: [x, 0.04, z], size: [L.thickness + 0.04, 0.08, L.thickness + 0.04] })),
    // The stripes: one down the back from the withers to the tail, one
    // across the shoulders reaching down over the sides
    stripes: [
      { at: [0, top + 0.1, (tailRoot + 0.1) / 2], turn: [-Math.PI / 2, 0, 0], size: [0.045, B.length - 0.2 - 0.06, 0.3] },
      { at: [0, top + 0.1, B.length / 2 - 0.3], turn: [-Math.PI / 2, 0, 0], size: [B.width + 0.2, 0.045, 0.44] },
    ],
    mane,
    tail: {
      points: [[0, top - 0.08, tailRoot], [0, top - 0.16, -B.length / 2 - 0.08], [0, top - 0.34, -B.length / 2 - 0.12], [0, top - 0.5, -B.length / 2 - 0.13]],
      rootR: 0.04,
      tipR: 0.028,
      sway: 1,
    },
    tuft: [0, top - 0.55, -B.length / 2 - 0.13],
    top: earTip[1],
  };
}

// How tall the donkey stands off its ground: the tips of its ears.
export function donkeyHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// body across, muzzle to tail along.
export function donkeyFootprintOf(C) {
  return { x: 0.3 * C.size, z: 0.8 * C.size };
}

// One donkey, standing on the ground at y = 0 facing +z. `config`
// overrides any of DONKEY's fields for this one instance.
export default function Donkey({ config }) {
  const C = useMemo(() => merge(DONKEY, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, legs, neck, head and tail as one, poured round the
  // parts and the tail's; with a copy of where every vertex rests, and
  // which are tail, for the swish to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The paint: the muzzle, round the head's end; the belly, from
  // underneath; the hooves, round each foot; and the stripes, if it has
  // them, down onto the back.
  const muzzle = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(...lay.muzzle.turn), lay.muzzle.size), [lump, lay.muzzle]);
  useEffect(() => () => muzzle.dispose(), [muzzle]);
  const belly = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.belly.at), new THREE.Euler(...lay.belly.turn), lay.belly.size), [lump, lay.belly]);
  useEffect(() => () => belly.dispose(), [belly]);
  const hooves = useMemo(() => lay.hooves.map((h) => paintOn(lump.geo, new THREE.Vector3(...h.at), new THREE.Euler(0, 0, 0), h.size)), [lump, lay.hooves]);
  useEffect(() => () => hooves.forEach((g) => g.dispose()), [hooves]);
  const stripes = useMemo(() => (C.stripe ? lay.stripes.map((s) => paintOn(lump.geo, new THREE.Vector3(...s.at), new THREE.Euler(...s.turn), s.size, { lift: 0.009 })) : []), [C.stripe, lump, lay.stripes]);
  useEffect(() => () => stripes.forEach((g) => g.dispose()), [stripes]);

  // The swish: the tail bent slowly side to side about its root, each
  // vertex by its weight; the tuft swung round the root with the tip.
  const clock = useRef(0);
  const tuft = useRef();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 3) * 0.6 * C.wag * lay.tail.sway;
    bendTail(lump, lump.root, angle);
    if (tuft.current) tuft.current.rotation.y = angle;
  });

  const coat = unlitMat(paint.coat);
  const pale = unlitMat(paint.pale);
  const mane = unlitMat(paint.mane);
  const dark = unlitMat(paint.dark);
  return (
    <group scale={C.size}>
      {/* The lump: body, legs, neck, head and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The muzzle round the head's end and the belly underneath, the
          hooves round the feet, and the stripes over the back. */}
      <mesh geometry={muzzle} receiveShadow material={pale} />
      <mesh geometry={belly} receiveShadow material={pale} />
      {hooves.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={dark} />)}
      {stripes.map((g, i) => <mesh key={i} geometry={g} receiveShadow material={dark} />)}
      {/* The mane: a thin dark box lying along the top of the neck,
          leaning with it, sunk a little into it. */}
      <mesh position={lay.mane.at} rotation-x={lay.mane.lean} castShadow receiveShadow material={mane}>
        <boxGeometry args={[0.07, lay.mane.length, 0.09]} />
      </mesh>
      {/* The tuft: a dark bead drawn out long, hung off the tail's tip,
          swung about the tail's root with the swish. */}
      <group ref={tuft} position={lump.root.toArray()}>
        <mesh position={[lay.tuft[0] - lump.root.x, lay.tuft[1] - lump.root.y, lay.tuft[2] - lump.root.z]} scale={[1, 1.7, 1]} castShadow material={mane}>
          <sphereGeometry args={[0.045, 12, 8]} />
        </mesh>
      </group>
      {/* The head's own: everything on it, turned with its dip. */}
      <group position={lay.head} rotation-x={lay.dip}>
        {/* Ears: tall flattened capsules standing up off the back of the
            head, each leaning a little out. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * lay.ears.at[0], lay.ears.at[1], lay.ears.at[2]]} rotation={[0, 0, -s * lay.ears.splay]} scale={[1, 1, 0.45]} castShadow receiveShadow material={coat}>
            <capsuleGeometry args={[EAR_R, C.ears.length, 4, 12]} />
          </mesh>
        ))}
        {/* Eyes: dark beads on either side of the head. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * lay.eyes[0], lay.eyes[1], lay.eyes[2]]} castShadow material={unlitMat(paint.eyes)}>
            <sphereGeometry args={[EYE_R, 12, 8]} />
          </mesh>
        ))}
        {/* Nostrils: two smaller beads on the front of the muzzle. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * lay.nostrils[0], lay.nostrils[1], lay.nostrils[2]]} castShadow material={dark}>
            <sphereGeometry args={[NOSTRIL_R, 10, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
