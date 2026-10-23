import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";

import { lumpOf, tailBalls, tailParts, tailWeights, restOf, bendTail } from "../../world/lump.js";
import { paintOn } from "../../world/paint.js";
import { LION } from "./objects.js";

// Where everything sits, at size 1: the cat's standing frame (see
// cat/Cat.jsx) grown into a big cat. The lion is one lump (see
// world/lump.js): `parts` are the forms it is poured from — ONE rounded
// block for head and body together, each leg a sturdier block pulled
// straight down out of one of its corners to the ground, and the tail a
// run of capsules out of its rear, hanging down and round to one side,
// with the TUFT
// a thicker capsule on its tip. The face is drawn on the block's front:
// `face` is the middle of it, on the front surface; `ears` where the
// two ears sit, from `face`. `chest` is the lighter bib painted on the
// front, projected from `at` straight back along -z, `size` across and
// tall, its top arched and its bottom corners rounded off by `radius`. The tail is a curve of `points` from where it
// leaves the rear to its tip, `rootR` thick where it leaves and `tipR`
// at the tip, `tuft` how thick the tuft is and `tuftLength` how far it
// runs on past the tip; the swish bends it from the root, `sway`
// scaling that. `mane` is the ring of balls the mane is poured from:
// `at` its middle (the face's, a little down), `rx` and `ry` how far
// out the balls' centres sit across and up, `r` each ball, `z` how far
// back from the face's front each ring lies, and `count` the balls
// round each ring — two rings, the front one framing the face and a
// wider one behind it over the shoulders and down the chest. `top` is
// how tall the lion stands, to the top of its head; `maneTop` to the
// top of its mane.
function layoutOf(C) {
  const B = C.body;
  const L = C.legs;
  const block = (at, size) => ({ kind: "box", at, half: [size[0] / 2 - B.round, size[1] / 2 - B.round, size[2] / 2 - B.round], round: B.round, blend: 0 });
  // A leg: a sturdy block from up inside the body straight down to the
  // ground, its edges rounded, filleting into the belly by L.blend.
  const leg = (x, z, top) => ({ kind: "box", at: [x, top / 2, z], half: [L.thickness / 2 - L.round, top / 2 - L.round, L.thickness / 2 - L.round], round: L.round, blend: L.blend });
  // Standing: the block up on four legs — each pulled down from one of
  // its corners, flush with the sides and the ends — the face on its
  // front, the tail out of the top of its rear, hanging down and round
  // to its side so the tuft shows beside a hind leg.
  const lx = B.width / 2 - L.thickness / 2 - 0.01, lz = B.length / 2 - L.thickness / 2 - 0.01;
  const feet = [[-lx, 0, lz], [lx, 0, lz], [-lx, 0, -lz], [lx, 0, -lz]];
  const bottom = 0.35, top = bottom + B.height;
  const faceY = top - 0.17, front = B.length / 2;
  const mane = { at: [0, faceY - 0.04, front], rx: 0.37, ry: 0.33, r: 0.125, z: 0.09, count: 12 };
  return {
    parts: [block([0, bottom + B.height / 2, 0], [B.width, B.height, B.length]), ...feet.map(([x, , z]) => leg(x, z, bottom + 0.2))],
    face: [0, faceY, front],
    ears: [0.2, 0.2, -0.02],
    // The bib: from under the muzzle down the chest between the front
    // legs' tops, a little wider than the gap between them, its top
    // arched and its bottom corners rounded off
    chest: { at: [0, 0.43, front + 0.02], size: [2 * lx - L.thickness + 0.08, 0.28], radius: 0.08 },
    mane,
    tail: {
      points: [[0, top - 0.12, -front + 0.06], [0.04, top - 0.16, -front - 0.22], [0.2, top - 0.34, -front - 0.32], [0.36, 0.3, -front - 0.24], [0.42, 0.18, -front - 0.1]], // out the back, down and round to hang beside the right hind leg
      rootR: 0.07,
      tipR: 0.045,
      tuft: 0.075,
      tuftLength: 0.12,
      sway: 1,
    },
    top,
    maneTop: mane.at[1] + mane.ry + 0.03 + mane.r, // the back ring's, the taller
  };
}

// How tall the lion stands off its ground: the top of its head, or of
// its mane when it has one.
export function lionHeightOf(C) {
  const lay = layoutOf(C);
  return (C.mane ? lay.maneTop : lay.top) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// mane across, the nose to the tail's tuft along.
export function lionFootprintOf(C) {
  return { x: 0.5 * C.size, z: 1.05 * C.size };
}

// The tuft: the tail carried on past its last ball `length` further in
// the direction it was going, as a thicker capsule; and two balls the
// size of it, at the very end of the tail (`u` 1), so the swish carries
// every vertex of it with the tip (tailWeights reaches only 1.8 times a
// ball's radius, and the tail's own last balls are slimmer than the tuft).
function tuftOf(samples, tail) {
  const tip = new THREE.Vector3(...samples[samples.length - 1].at);
  const dir = tip.clone().sub(new THREE.Vector3(...samples[samples.length - 2].at)).normalize();
  const a = tip.clone().addScaledVector(dir, -0.02), b = tip.clone().addScaledVector(dir, tail.tuftLength);
  return {
    part: { kind: "capsule", a: a.toArray(), b: b.toArray(), ra: tail.tuft, rb: tail.tuft * 0.85, blend: 0.05 },
    balls: [{ at: a.toArray(), r: tail.tuft * 1.2, u: 1 }, { at: b.toArray(), r: tail.tuft * 1.2, u: 1 }],
    at: a.clone().lerp(b, 0.5),
    dir,
    length: tail.tuftLength + 2 * tail.tuft + 0.06,
  };
}

// The mane: two rings of balls round the face's middle, the front one
// just behind the face's surface so its balls bulge forward round the
// face, and a wider one further back over the shoulders; each ring an
// ellipse of `count` balls, run together into one thick collar.
function maneParts(M) {
  const ring = (rx, ry, r, z, count, turn) =>
    Array.from({ length: count }, (_, i) => {
      const a = turn + (i / count) * Math.PI * 2;
      return { kind: "sphere", at: [M.at[0] + rx * Math.cos(a), M.at[1] + ry * Math.sin(a), M.at[2] - z], r, blend: 0.08 };
    });
  return [
    ...ring(M.rx, M.ry, M.r, M.z, M.count, Math.PI / 2),
    ...ring(M.rx + 0.04, M.ry + 0.03, M.r, M.z + 0.17, M.count, Math.PI / 2 + Math.PI / M.count),
  ];
}

// A whisker's turn: lying along x on side `s` (-1 left, +1 right), fanned
// up by `fan` radians and swept a little forward — the face is a flat
// front, so swept back they would run into it. Euler XYZ applies z
// first, which lays the cylinder flat and tilts it; then y sweeps it.
const WHISKER_SWEEP = -0.06;
const whiskerTurn = (s, fan) => [0, s * WHISKER_SWEEP, -s * (Math.PI / 2 - fan)];
const whiskerDir = (s, fan) =>
  new THREE.Vector3(s * Math.cos(fan) * Math.cos(WHISKER_SWEEP), Math.sin(fan), -Math.cos(fan) * Math.sin(WHISKER_SWEEP));
const FANS = [-0.16, 0, 0.16];
const MUZZLE_R = 0.13, MUZZLE_DOWN = 0.1, MUZZLE_OUT = 0.03;
const EAR_R = 0.075, EAR_INNER_R = 0.045;
const EYE_X = 0.13, EYE_Y = 0.07, EYE_R = 0.042, IRIS_SPREAD = 0.8;

const Y = new THREE.Vector3(0, 1, 0);

// One lion, standing on the ground at y = 0 facing +z. `config` overrides
// any of LION's fields for this one instance.
export default function Lion({ config }) {
  const C = useMemo(() => merge(LION, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const paint = C.colors;

  // The lump: head, body, legs, tail and tuft as one, poured round the
  // frame's parts and the tail's; with a copy of where every vertex
  // rests, and which are tail (the tuft's balls counted in), for the
  // swish to bend.
  const tail = useMemo(() => tailBalls(lay.tail), [lay]);
  const tuft = useMemo(() => tuftOf(tail, lay.tail), [tail, lay.tail]);
  const lump = useMemo(() => {
    const geo = lumpOf([...lay.parts, ...tailParts(tail), tuft.part], { resolution: C.resolution });
    return { geo, rest: restOf(geo), ...tailWeights(geo, [...tail, ...tuft.balls]), root: new THREE.Vector3(...lay.tail.points[0]) };
  }, [lay, tail, tuft, C.resolution]);
  useEffect(() => () => lump.geo.dispose(), [lump]);

  // The mane: a second lump of its own, in its own colour, framing the
  // face, if it has one.
  const mane = useMemo(() => (C.mane ? lumpOf(maneParts(lay.mane), { resolution: C.resolution }) : null), [C.mane, lay.mane, C.resolution]);
  useEffect(() => () => mane?.dispose(), [mane]);

  // The chest: a bib painted on the front, from straight ahead, its top
  // arched; projected 0.4 deep, no further, so it stays on the front it
  // is meant for.
  const chest = useMemo(() => paintOn(lump.geo, new THREE.Vector3(...lay.chest.at), new THREE.Euler(0, 0, 0), [lay.chest.size[0], lay.chest.size[1], 0.4], { arch: true, radius: lay.chest.radius }), [lump, lay.chest]);
  useEffect(() => () => chest.dispose(), [chest]);

  // The tuft's dark: the tail's tip painted, a box round the tuft lying
  // along it, square across it where it is; carrying the same weights as
  // the lump's tail, so the swish bends it with it.
  const tuftPaint = useMemo(() => {
    const side = new THREE.Vector3().crossVectors(tuft.dir, Y).normalize();
    if (side.lengthSq() < 0.5) side.set(1, 0, 0);
    const across = new THREE.Vector3().crossVectors(tuft.dir, side);
    const turn = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, tuft.dir, side));
    const geo = paintOn(lump.geo, tuft.at, turn, [lay.tail.tuft * 4, tuft.length, lay.tail.tuft * 4]);
    return { geo, ...tailWeights(geo, [...tail, ...tuft.balls]), rest: restOf(geo) };
  }, [lump, tail, tuft, lay.tail]);
  useEffect(() => () => tuftPaint.geo.dispose(), [tuftPaint]);

  // The swish: the tail bent side to side about its root, each vertex by
  // its weight, the normals turned with it — the lump's, and the painted
  // tuft's on it.
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const angle = Math.sin(clock.current * 2.2) * 0.5 * C.swish * lay.tail.sway;
    bendTail(lump, lump.root, angle);
    bendTail(tuftPaint, lump.root, angle);
  });

  const head = new THREE.Vector3(...lay.face);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const maneMat = unlitMat(paint.mane);
  const F = 0; // the face's middle is on the front surface
  const muzzle = head.clone().add(new THREE.Vector3(0, -MUZZLE_DOWN, F + MUZZLE_OUT));
  // The iris: a cap of the bead's sphere, the front IRIS_SPREAD of it
  // either way from straight ahead, a hair proud. Built round +y and
  // turned to face +z.
  const irisGeo = useMemo(() => new THREE.SphereGeometry(EYE_R + 0.002, 14, 6, 0, Math.PI * 2, 0, IRIS_SPREAD).rotateX(Math.PI / 2), []);
  useEffect(() => () => irisGeo.dispose(), [irisGeo]);
  const noseGeo = useMemo(() => {
    const t = new THREE.Shape();
    t.moveTo(-0.05, 0.025);
    t.lineTo(0.05, 0.025);
    t.lineTo(0, -0.045);
    t.closePath();
    return new THREE.ExtrudeGeometry(t, { depth: 0.02, bevelEnabled: false });
  }, []);
  useEffect(() => () => noseGeo.dispose(), [noseGeo]);
  return (
    <group scale={C.size}>
      {/* The lump: head, body, legs and tail, one form. */}
      <mesh geometry={lump.geo} castShadow receiveShadow material={fur} />
      {/* The mane, a lump of its own round the head. */}
      {mane && <mesh geometry={mane} castShadow receiveShadow material={maneMat} />}
      {/* The chest: a lighter bib painted on the front. */}
      <mesh geometry={chest} receiveShadow material={belly} />
      {/* The tuft painted dark on the tail's tip. */}
      <mesh geometry={tuftPaint.geo} receiveShadow material={maneMat} />
      {/* The face, drawn on the block's front. */}
      <group position={lay.face}>
        {/* Ears: small round ones, a ball flattened front to back on
            each front corner of the top, a smaller paler one on its
            front for the inside. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * lay.ears[0], lay.ears[1], lay.ears[2]]}>
            <mesh scale={[1, 1, 0.55]} castShadow receiveShadow material={fur}>
              <sphereGeometry args={[EAR_R, 14, 10]} />
            </mesh>
            <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.4]} material={belly}>
              <sphereGeometry args={[EAR_INNER_R, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* The muzzle bump, in the belly colour; the nose, a triangle
            point-down on its front; and the mouth, a line drawn down
            from the nose like a decal. */}
        <mesh position={[0, -MUZZLE_DOWN, F + MUZZLE_OUT]} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[MUZZLE_R, 16, 12]} />
        </mesh>
        <mesh geometry={noseGeo} position={[0, -MUZZLE_DOWN + 0.06, F + MUZZLE_OUT + MUZZLE_R - 0.016]} castShadow material={unlitMat(paint.nose)} />
        <mesh position={[0, -MUZZLE_DOWN - 0.02, F + MUZZLE_OUT + MUZZLE_R - 0.024]} rotation-x={0.5} material={unlitMat(paint.pupil)}>
          <boxGeometry args={[0.014, 0.09, 0.014]} />
        </mesh>
        {/* Eyes: a dark bead with the iris painted on its front — a cap
            of a sphere a hair bigger than the bead, lying on it. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * EYE_X, EYE_Y, F + 0.004]}>
            <mesh castShadow material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[EYE_R, 12, 8]} />
            </mesh>
            <mesh geometry={irisGeo} material={unlitMat(paint.eyes)} />
          </group>
        ))}
      </group>
      {/* Whiskers: three hair-thin cylinders a side, fanned, from the
          front of the muzzle, clear of the face. */}
      {[-1, 1].map((s) =>
        FANS.map((fan, i) => {
          const at = whiskerDir(s, fan).multiplyScalar(0.22).add(muzzle).add(new THREE.Vector3(s * 0.05, 0, MUZZLE_R * 0.55));
          return (
            <mesh key={`${s}${i}`} position={at.toArray()} rotation={whiskerTurn(s, fan)} material={belly}>
              <cylinderGeometry args={[0.006, 0.006, 0.46, 4]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}
