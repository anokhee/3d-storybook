import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { Eye, AHEAD, OUT } from "../../world/eye.jsx";
import { BUFFALO } from "./objects.js";

// Where everything sits, at size 1: the dog's standing frame (see
// dog/Dog.jsx) with a buffalo's parts on it. The buffalo is one lump
// (see world/lump.js): `parts` are the forms it is poured from — ONE big
// rounded block for the body, a HUMP — a thick capsule tapering down
// toward the rump — pressed into its top over the shoulders with a wide
// blend, each leg a thick block pulled
// straight down out of a corner to the ground, the head a broad block
// out of the front held low and run back into the body, the muzzle a
// smaller block out of the lower half of its face, and the tail a run
// of capsules out of the top of its rear. The face is drawn on the
// head's front: `face` is the middle of it, on the front surface; `ears`
// where the two ears sit on the sides of the head, from `face`;
// `nostrils` where the two beads sit on the muzzle's front, from `face`.
// `muzzle` is the patch painted over the end of the nose: a box
// projected onto the lump along its own -z, `size` across, tall and
// deep. `horns` are the two curves of `points` each horn runs along,
// from inside the head out and up to its tip, `rootR` thick where it
// leaves and `tipR` at the tip — the same shape as a tail, so the tail's
// own sampling (tailBalls, tailParts) builds them, as a lump of their
// own in the horns' colour. The tail is its own curve of `points` from
// where it leaves the rump to its tip, `rootR` and `tipR` the same way;
// the wag bends it from the root, `sway` scaling that, small because a
// buffalo's tail only flicks. `tuft` is the bead on the tail's tip.
// `noseHorns` are where a rhino's horns stand, from `face`.
// `top` is how tall the buffalo stands, to the top of the hump.
//
// The hump sits over the shoulders a little ahead of the block's middle,
// its top B.hump above the back; the head's top is HEAD.drop below the
// block's, its back HEAD_EMBED inside the block's front — well within the
// flat of the front, under the rounded top edge, so nothing meets at a
// seam. The muzzle is a block out of the lower half of the face, MUZZLE
// across, tall and deep, its front `out` ahead of the face, its middle
// `down` below the face's.
const HEAD_EMBED = 0.11;
const MUZZLE = { size: [0.38, 0.24, 0.24], round: 0.07, out: 0.14, down: 0.08 };
const EAR_R = 0.065; // a small ear: a ball, flattened and stretched out sideways
const EYE_X = 0.15, EYE_Y = 0.08, EYE_R = 0.054;
const NOSTRIL_X = 0.08, NOSTRIL_R = 0.028;
const TUFT_R = 0.07;
// A rhino's nose horns: each a curve like a buffalo's horn, the big one
// `r` thick at the base and `tipR` at the tip, its base tucked `tuck`
// into the snout; the small one `small` its size, right behind it —
// `behind` further back and `behindUp` higher, where the snout is
// taller.
// The snout (a rhino's), after the giraffe's: a broad block `back` sunk
// `inset` into the face, `down` below its middle, and a narrower block
// `front` ahead of it, run together so it tapers, turned `droop`
// nose-down; `reach` how far its end is ahead of the face. Painted from
// `from` ahead of the face outwards, with the nostrils on its end.
const SNOUT = { back: [0.38, 0.28, 0.3], front: [0.31, 0.23, 0.22], round: 0.09, inset: 0.1, reach: 0.25, down: 0.06, droop: 0.4, from: 0.02 };
const TRUNK = { rootR: 0.13, tipR: 0.055, swing: 0.5 };
const NOSE_HORN = { r: 0.09, tipR: 0.035, small: 0.5, behind: 0.13, behindUp: 0.035, tuck: 0.03 };
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const H = C.head;
  const block = (at, size, round, blend = 0, tilt = 0) => ({ kind: "box", at, half: [size[0] / 2 - round, size[1] / 2 - round, size[2] / 2 - round], round, blend, tilt });
  // A leg: a thick block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the hump on its
  // shoulders, the head out of its front, the tail out of the top of
  // its rear, hanging down.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const legTop = 0.62, bottom = legTop - 0.22, back = bottom + B.height;
  const top = back + B.hump;
  // The hump: a capsule sunk into the back, thick over the shoulders
  // with its top at `top` and tapering down and back toward the rump,
  // blending wide into the back so it rises as a swell with no ridge
  const humpR = 0.3;
  const hump = { kind: "capsule", a: [0, top - humpR, 0.28], b: [0, back - 0.12, -0.22], ra: humpR, rb: 0.2, blend: 0.25 };
  // The head: its top H.drop below the back, its back HEAD_EMBED inside
  // the block's front, filleting into it
  const headY = back - H.drop - H.height / 2;
  const headZ = B.length / 2 - HEAD_EMBED + H.length / 2;
  const head = block([0, headY, headZ], [H.width, H.height, H.length], H.round, 0.08);
  const face = [0, headY, headZ + H.length / 2];
  // The muzzle: a block out of the lower half of the face, run back into it
  // Or the snout (a rhino's), after the giraffe's (goat/Goat.jsx): a broad
  // block sunk into the face and a narrower one ahead of it run together
  // so it tapers, the whole turned SNOUT.droop nose-down; `onSnout` a
  // point `dy` up and `dz` along it from where it leaves the face
  const snoutBase = [0, face[1] - SNOUT.down, face[2]];
  const onSnout = (dy, dz) => [0, snoutBase[1] + dy * Math.cos(SNOUT.droop) - dz * Math.sin(SNOUT.droop), snoutBase[2] + dy * Math.sin(SNOUT.droop) + dz * Math.cos(SNOUT.droop)];
  const muzzle = C.snout
    ? [block(onSnout(0, SNOUT.back[2] / 2 - SNOUT.inset), SNOUT.back, SNOUT.round, 0.04, SNOUT.droop), block(onSnout(-0.015, SNOUT.reach - SNOUT.front[2] / 2), SNOUT.front, SNOUT.round, 0.2, SNOUT.droop)]
    : [block([0, face[1] - MUZZLE.down, face[2] + MUZZLE.out - MUZZLE.size[2] / 2], MUZZLE.size, MUZZLE.round, 0.03)];
  // The horns: out of the head's upper corners just above the ears,
  // straight out past its side, up and curling in a little at the tip;
  // `spread` scales how far out they sweep
  const sp = C.horns.spread;
  const hy = face[1] + H.height / 2 - 0.04, hz = headZ - 0.04, hx = H.width / 2;
  const horn = (side) => ({
    points: [
      [side * (hx - 0.07), hy - 0.07, hz],
      [side * (hx + 0.06 + 0.08 * sp), hy - 0.03, hz],
      [side * (hx + 0.1 + 0.17 * sp), hy + 0.14, hz - 0.03],
      [side * (hx + 0.04 + 0.11 * sp), hy + 0.3, hz - 0.06],
    ],
    rootR: C.horns.rootR,
    tipR: C.horns.tipR,
  });
  // The trunk (an elephant's): a curve out of the face's lower middle,
  // hanging down and curling forward at the tip, thick at the root and
  // thin at the end, poured into the body's own lump so it has no seam;
  // `swing` turns it about its root. The tusks are curves like the
  // horns', out of either side of its root, forward, down and up at the tip.
  const trunkAt = (dy, dz) => [0, face[1] + dy, face[2] + dz];
  const trunk = {
    points: [trunkAt(0.1, -0.12), trunkAt(-0.08, 0.04), trunkAt(-0.3, 0.09), trunkAt(-0.5, 0.1), trunkAt(-0.6, 0.2), trunkAt(-0.58, 0.32)],
    rootR: TRUNK.rootR,
    tipR: TRUNK.tipR,
  };
  const tusk = (side) => ({
    points: [[side * 0.13, face[1] - 0.1, face[2] - 0.08], [side * 0.17, face[1] - 0.2, face[2] + 0.06], [side * 0.2, face[1] - 0.3, face[2] + 0.2], [side * 0.21, face[1] - 0.28, face[2] + 0.32]],
    rootR: 0.05,
    tipR: 0.018,
  });
  // The tail: out of the top of the rear and hanging down, its run from
  // the root scaled by C.tail.length
  const tl = C.tail.length, tailRoot = [0, back - 0.08, -B.length / 2 + 0.08];
  const tailPoints = [[0, 0, 0], [0, -0.14, -0.2], [0, -0.42, -0.22], [0, -0.7, -0.18]].map(([x, y, z]) => [x, tailRoot[1] + y * tl, tailRoot[2] + z * tl]);
  const out = {
    parts: [block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length], B.round), ...(B.hump > 0 ? [hump] : []), ...feet.map(([x, , z]) => leg(x, z, legTop)), head, ...(C.trunk ? [] : muzzle)],
    face,
    ears: [H.width / 2 + 0.07, hy - face[1] - 0.15, hz - face[2] + 0.02],
    // The ears stood upright on top of the head instead (a rhino's),
    // toward its back corners, from `face`
    earsUp: [H.width / 2 - 0.08, H.height / 2 + 0.06, -H.length + 0.22],
    // The eyes, from `face`: on its front, or on the sides of the head
    // clear of the snout
    eyes: C.snout || C.trunk ? [H.width / 2 - 0.005, 0.07, C.trunk ? -0.06 : -0.13] : [EYE_X, EYE_Y, 0.004],
    // The nostrils, from `face`; or, on the snout, from its end, turned
    // with it
    nostrils: [NOSTRIL_X, -MUZZLE.down - 0.02, MUZZLE.out + 0.004],
    snoutEnd: onSnout(-0.015, SNOUT.reach),
    muzzle: C.snout
      ? { at: onSnout(0, (SNOUT.from + SNOUT.reach + 0.04) / 2), turn: [SNOUT.droop, 0, 0], size: [SNOUT.back[0] + 0.04, SNOUT.back[1] + 0.08, SNOUT.reach + 0.04 - SNOUT.from] }
      : { at: [0, face[1] - MUZZLE.down, face[2] + MUZZLE.out - 0.1], turn: [0, 0, 0], size: [0.34, 0.2, 0.24] },
    horns: [horn(-1), horn(1)],
    trunk,
    tusks: [tusk(-1), tusk(1)],
    tail: {
      points: tailPoints,
      rootR: 0.07 * C.tail.thickness,
      tipR: 0.045 * C.tail.thickness,
      sway: 0.35,
    },
    tuft: tailPoints[tailPoints.length - 1],
    // Where the nose horns (a rhino's) stand: the big one on top of the
    // muzzle near its front, the small one behind it (see below)
    noseHorns: [
      C.snout
        ? { at: onSnout(SNOUT.front[1] / 2 - 0.015 - NOSE_HORN.tuck, SNOUT.reach - 0.13), tilt: SNOUT.droop }
        : { at: [0, face[1] - MUZZLE.down + MUZZLE.size[1] / 2 - NOSE_HORN.tuck, face[2] + MUZZLE.out - 0.1], tilt: 0 },
    ],
    top,
  };
  // The nose horns as curves, like the buffalo's horns: each up off its
  // base, then sweeping back to a blunt tip, its length scaled by
  // C.noseHorn, in the frame of whatever the big one stands on — the big
  // one, and the small one right behind it, `share` its size
  const big = out.noseHorns[0], k = C.noseHorn / 0.3;
  const onBig = (dy, dz) => [0, big.at[1] + dy * Math.cos(big.tilt) - dz * Math.sin(big.tilt), big.at[2] + dy * Math.sin(big.tilt) + dz * Math.cos(big.tilt)];
  const curve = (y0, z0, share) => {
    const m = k * share;
    return { points: [onBig(y0 - 0.02, z0), onBig(y0 + 0.1 * m, z0 - 0.005), onBig(y0 + 0.2 * m, z0 - 0.05 * m), onBig(y0 + 0.27 * m, z0 - 0.14 * m)], rootR: NOSE_HORN.r * Math.sqrt(share), tipR: NOSE_HORN.tipR * Math.sqrt(share) };
  };
  out.noseHornCurves = [curve(0, 0, 1), curve(NOSE_HORN.behindUp, -NOSE_HORN.behind, NOSE_HORN.small)];
  return out;
}

// How tall the buffalo stands off its ground: the top of its hump.
export function buffaloHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// horns across, nose to tail along.
export function buffaloFootprintOf(C) {
  return { x: 0.5 * C.size, z: 0.85 * C.size };
}

// One buffalo, standing on the ground at y = 0 facing +z. `config`
// overrides any of BUFFALO's fields for this one instance.
export default function Buffalo({ config }) {
  const C = useMemo(() => merge(BUFFALO, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: body, hump, head, muzzle, legs and tail as one, poured
  // round the parts and the tail's; with a copy of where every vertex
  // rests, and which are tail, for the wag to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...(C.trunk ? tailParts(tailBalls(lay.trunk)) : []), ...tailParts(tail)], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, tail), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, C.trunk, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The horns: each a lump of its own, poured round the capsules its
  // curve is sampled into, so its grid is fitted close and the tip stays
  // crisp; separate from the body so they take their own colour.
  // The nose horns, if it has them: each a lump of its own the same way
  const noseHorns = useMemo(() => (C.noseHorn > 0 ? lay.noseHornCurves.map((h) => lumpOf(tailParts(tailBalls(h)), { resolution: C.resolution })) : []), [C.noseHorn, lay.noseHornCurves, C.resolution]);
  useEffect(() => () => noseHorns.forEach((g) => g.dispose()), [noseHorns]);
  const horns = useMemo(() => (C.horns.show === false ? [] : lay.horns).map((h) => lumpOf(tailParts(tailBalls(h)), { resolution: C.resolution })), [lay.horns, C.horns.show, C.resolution]);
  const tusks = useMemo(() => (C.tusks ? lay.tusks.map((h) => lumpOf(tailParts(tailBalls(h)), { resolution: C.resolution })) : []), [C.tusks, lay.tusks, C.resolution]);
  useEffect(() => () => tusks.forEach((g) => g.dispose()), [tusks]);
  useEffect(() => () => horns.forEach((g) => g.dispose()), [horns]);

  // The muzzle, if it is painted: a patch over the end of the nose,
  // arched at the top and its bottom corners rounded off.
  const muzzle = useMemo(() => (C.muzzle ? paintOn(lump.geo, new THREE.Vector3(...lay.muzzle.at), new THREE.Euler(...lay.muzzle.turn), lay.muzzle.size, C.snout ? {} : { arch: true, radius: 0.1 }) : null), [C.muzzle, C.snout, lump, lay.muzzle]);
  useEffect(() => () => muzzle?.dispose(), [muzzle]);

  // The wag: the tail swung slowly side to side about its root, each
  // vertex by its weight, and the tuft carried round on its tip.
  const clock = useRef(0);
  const tuft = useRef();
  const tip = useMemo(() => new THREE.Vector3(...lay.tuft).sub(new THREE.Vector3(...lay.tail.points[0])), [lay]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.5) * 0.55 * C.wag * lay.tail.sway;
    bendTail(lump, lump.root, angle);
    if (tuft.current) tuft.current.position.copy(tip).applyAxisAngle(Y_AXIS, angle).add(lump.root);
  });
  const nostril = (s) => (
    <mesh key={s} position={C.snout ? [s * NOSTRIL_X * 0.8, 0.02, -0.004] : [s * lay.nostrils[0], lay.nostrils[1], lay.nostrils[2]]} castShadow material={unlitMat(paint.nose)}>
      <sphereGeometry args={[NOSTRIL_R, 12, 8]} />
    </mesh>
  );

  // An elephant's ear: narrow at the head, wide at its round end.
  const ear = useMemo(() => [-1, 1].map((s) => ({ outer: earOf({ a: 0.15, R: 0.26, c: 0.15 }, 0.035, s), inner: earOf({ a: 0.12, R: 0.22, c: 0.14 }, 0.045, s) })), []);
  useEffect(() => () => ear.forEach((e) => { e.outer.dispose(); e.inner.dispose(); }), [ear]);
  const H_SIDE = C.head.width / 2, H_TOP = C.head.height / 2 - 0.06, H_BACK = C.head.length / 2 + 0.06;

  const coat = unlitMat(paint.coat);
  return (
    <group scale={C.size}>
      {/* The lump: body, hump, head, muzzle, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={coat} />
      {/* The horns, pale, out of either side of the head. */}
      {horns.map((g, i) => <mesh key={i} geometry={g} castShadow receiveShadow material={unlitMat(paint.horn)} />)}
      {/* The tusks (an elephant's), pale, either side of the trunk's root. */}
      {tusks.map((g, i) => <mesh key={i} geometry={g} castShadow receiveShadow material={unlitMat(paint.horn)} />)}
      {/* The lighter muzzle painted over the end of the nose. */}
      {muzzle && <mesh geometry={muzzle} receiveShadow material={unlitMat(paint.muzzle)} />}
      {/* The tuft: a dark bead on the tail's tip, swung with it. */}
      <mesh ref={tuft} position={lay.tuft} castShadow material={unlitMat(paint.tuft)}>
        <sphereGeometry args={[TUFT_R * C.tail.thickness, 12, 8]} />
      </mesh>
      {/* The nose horns, if it has them: two curving up and back off the
          muzzle (or the snout), the small one right behind the big. */}
      {noseHorns.map((g, i) => <mesh key={i} geometry={g} castShadow receiveShadow material={unlitMat(paint.horn)} />)}
      {/* The snout's nostrils, on its end, turned with it. */}
      {C.snout && (
        <group position={lay.snoutEnd} rotation-x={SNOUT.droop}>
          {[-1, 1].map(nostril)}
        </group>
      )}
      {/* The face, drawn on the head's front. */}
      <group position={lay.face}>
        {/* Ears: small balls flattened and stretched out of the sides of
            the head under the horns, drooping a little. */}
        {/* Or, standing upright, on top of the head toward its back, a
            little splayed and their flat faces forward. */}
        {/* Or, an elephant's: a flap each, standing up,
            narrow where it joins the side of the head and widening to a
            round end facing away from the face, swept back a little, a pink
            one on the front of each. */}
        {[-1, 1].map((s) => (C.ears?.big ? (
          <group key={s} position={[s * (H_SIDE - 0.01), 0.04, -H_BACK]} rotation={[0, s * 0.3, 0]} scale={[C.ears.big, C.ears.big * 0.75, C.ears.big]}>
            <mesh geometry={ear[(s + 1) / 2].outer} castShadow receiveShadow material={coat} />
            <mesh geometry={ear[(s + 1) / 2].inner} position={[0, 0, 0.012]} material={unlitMat(paint.ear)} />
          </group>
        ) : C.ears?.up ? (
          <mesh key={s} position={[s * lay.earsUp[0], lay.earsUp[1], lay.earsUp[2]]} rotation={[0, 0, -s * 0.2]} scale={[0.9, 1.7, 0.55]} castShadow receiveShadow material={coat}>
            <sphereGeometry args={[EAR_R, 12, 8]} />
          </mesh>
        ) : (
          <mesh key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]} rotation={[0, 0, -s * 0.35]} scale={[1.7, 0.6, 0.9]} castShadow receiveShadow material={coat}>
            <sphereGeometry args={[EAR_R, 12, 8]} />
          </mesh>
        )))}
        {/* Nostrils: two dark beads on the muzzle's front. */}
        {!C.snout && !C.trunk && [-1, 1].map(nostril)}
        {/* Eyes: white eyeballs either side above the muzzle, a round
            pupil in the eye colour (world/eye.jsx); on the sides of the
            head they look mostly ahead, a little out. */}
        {[-1, 1].map((s) => (
          <Eye key={s} position={[s * lay.eyes[0], lay.eyes[1], lay.eyes[2]]} r={EYE_R} look={C.snout || C.trunk ? [s, 0, AHEAD] : undefined} face={C.snout || C.trunk ? [s, 0, OUT] : undefined} pupil={paint.eyes} />
        ))}
      </group>
    </group>
  );
}
// An elephant's ear, standing upright: narrow where it joins the head
// (`a` either side of its middle, at x = 0) and widening out to a round
// end of radius `R` centred `c` out, bulging toward `side` (+1 or -1) in
// x, `depth` thick along z, centred.
function earOf({ a, R, c }, depth, side) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -a);
  sh.bezierCurveTo(c * 0.5, -a, c * 0.6, -R, c, -R);
  sh.absarc(c, 0, R, -Math.PI / 2, Math.PI / 2, false);
  sh.bezierCurveTo(c * 0.6, R, c * 0.5, a, 0, a);
  sh.lineTo(0, -a);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  if (side < 0) g.rotateY(Math.PI);
  return g;
}
const Y_AXIS = new THREE.Vector3(0, 1, 0);
