import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { lumpOf } from "./lump.js";
import { CAT, coatOf } from "./objects.js";

// Where everything sits for each pose, at size 1. The cat is one lump
// (see lump.js): `balls` are the metaballs it is poured round — the body
// as a row of them, the head on a neck ball, each leg a chain pulled down
// out of the body to a foot on the ground. `spine` is the body's balls in
// order, for the stripes to ring; `feet` where the socks go; `chest` the
// lighter patch pressed on the front, or null. The tail is a curve of
// points relative to its `root`, where the swish turns it; `sway` scales
// the swish, small when the tail lies on the ground. `top` is how tall
// the cat stands, at the head.
function layoutOf(C) {
  const B = C.body;
  const H = C.head;
  const L = C.legs;
  const leg = (x, z, top) => [
    { at: [x, top, z], r: L.radius + 0.03 },
    { at: [x, (top + L.radius) / 2, z], r: L.radius + 0.01 },
    { at: [x, L.radius, z], r: L.radius },
  ];
  if (C.pose === "sitting") {
    const spine = [
      { at: [0, 0.38, -0.2], r: B.radius + 0.02 },
      { at: [0, 0.62, -0.08], r: B.radius - 0.02 },
      { at: [0, 0.84, 0.08], r: B.radius - 0.07 },
    ];
    const head = [0, 1.05, 0.3];
    const feet = [[-0.16, L.radius, 0.3], [0.16, L.radius, 0.3]];
    return {
      balls: [
        ...spine,
        { at: [0, 0.95, 0.2], r: 0.2 }, // the neck
        { at: head, r: H.radius },
        { at: [-0.2, 0.26, -0.2], r: 0.25 }, // the haunches
        { at: [0.2, 0.26, -0.2], r: 0.25 },
        { at: [-0.2, 0.1, 0.1], r: 0.1 }, // the hind feet, toes forward
        { at: [0.2, 0.1, 0.1], r: 0.1 },
        ...leg(-0.16, 0.3, 0.55),
        ...leg(0.16, 0.3, 0.55),
      ],
      spine,
      feet,
      chest: { at: [0, 0.68, 0.3], scale: [0.75, 1.1, 0.45], r: 0.2 },
      head,
      tail: {
        root: [0.12, 0.09, -0.45],
        points: [[0, 0, 0], [0.25, -0.01, -0.05], [0.42, -0.02, 0.3], [0.3, -0.02, 0.58], [0.0, -0.02, 0.62]],
        sway: 0.25,
      },
      top: head[1] + H.radius,
    };
  }
  if (C.pose === "loaf") {
    const spine = [
      { at: [0, 0.3, -0.35], r: B.radius - 0.02 },
      { at: [0, 0.32, -0.05], r: B.radius + 0.01 },
      { at: [0, 0.3, 0.2], r: B.radius - 0.02 },
    ];
    const head = [0, 0.6, 0.35];
    const feet = [[-0.15, 0.08, 0.5], [0.15, 0.08, 0.5]];
    return {
      balls: [
        ...spine,
        { at: [0, 0.5, 0.3], r: 0.2 }, // the neck
        { at: head, r: H.radius },
        { at: feet[0], r: 0.09 }, // the paws, peeking out
        { at: feet[1], r: 0.09 },
      ],
      spine,
      feet,
      chest: { at: [0, 0.38, 0.5], scale: [0.7, 0.7, 0.4], r: 0.2 },
      head,
      tail: {
        root: [0.1, 0.1, -0.6],
        points: [[0, 0, 0], [0.22, -0.01, -0.08], [0.38, -0.03, 0.18], [0.34, -0.04, 0.6], [0.22, -0.04, 0.9]],
        sway: 0.2,
      },
      top: head[1] + H.radius,
    };
  }
  const spine = [
    { at: [0, 0.66, -0.3], r: B.radius - 0.05 },
    { at: [0, 0.68, 0.0], r: B.radius - 0.02 },
    { at: [0, 0.66, 0.26], r: B.radius - 0.06 },
  ];
  const head = [0, 0.96, 0.52];
  const feet = [[-0.2, L.radius, 0.3], [0.2, L.radius, 0.3], [-0.2, L.radius, -0.3], [0.2, L.radius, -0.3]];
  return {
    balls: [
      ...spine,
      { at: [0, 0.84, 0.4], r: 0.17 }, // the neck
      { at: head, r: H.radius },
      ...feet.flatMap(([x, , z]) => leg(x, z, 0.44)),
    ],
    spine,
    feet,
    chest: { at: [0, 0.52, 0.46], scale: [0.8, 1.0, 0.45], r: 0.2 },
    head,
    tail: {
      root: [0, 0.6, -0.5],
      points: [[0, -0.02, 0], [0, -0.12, -0.28], [0, -0.05, -0.5], [0, 0.25, -0.58], [0, 0.48, -0.45]],
      sway: 1,
    },
    top: head[1] + H.radius,
  };
}

// How tall the cat stands off its ground: the top of its head.
export function catHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// whiskers' tips across, the tail's tip along.
export function catFootprintOf(C) {
  return { x: 0.55 * C.size, z: 1.15 * C.size };
}

// A whisker's turn: lying along x on side `s` (-1 left, +1 right), fanned
// up by `fan` radians and swept back a little. Euler XYZ applies z first,
// which lays the cylinder flat and tilts it; then y sweeps it back.
const WHISKER_SWEEP = 0.3;
const whiskerTurn = (s, fan) => [0, s * WHISKER_SWEEP, -s * (Math.PI / 2 - fan)];
const whiskerDir = (s, fan) =>
  new THREE.Vector3(s * Math.cos(fan) * Math.cos(WHISKER_SWEEP), Math.sin(fan), -Math.cos(fan) * Math.sin(WHISKER_SWEEP));
const FANS = [-0.16, 0, 0.16];

// A turn that points local z along `dir`, as an Euler for a mesh.
const Z = new THREE.Vector3(0, 0, 1);
const along = (dir) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, dir.clone().normalize())).toArray().slice(0, 3);

// One cat, standing on the ground at y = 0 facing +z. `config` overrides
// any of CAT's fields for this one instance; the coat it names lays its
// colours and markings under the rest of it.
export default function Cat({ config }) {
  const C = useMemo(() => merge(merge(CAT, coatOf(config?.coat ?? CAT.coat)), config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const H = C.head;
  const L = C.legs;
  const paint = C.colors;

  // The lump: head, body and legs as one, poured round the pose's balls.
  const lump = useMemo(() => lumpOf(lay.balls, { resolution: C.resolution }), [lay, C.resolution]);
  useEffect(() => () => lump.dispose(), [lump]);

  // The tail: a tube along a smooth curve through the pose's points.
  const tailCurve = useMemo(() => new THREE.CatmullRomCurve3(lay.tail.points.map((p) => new THREE.Vector3(...p))), [lay]);
  const tailGeo = useMemo(() => new THREE.TubeGeometry(tailCurve, 24, C.tail.radius, 8, false), [tailCurve, C.tail.radius]);
  useEffect(() => () => tailGeo.dispose(), [tailGeo]);

  // A tabby's stripes: half-rings of the markings colour over the back,
  // one round each ball of the spine, turned to sit square across it;
  // and full rings round the tail, square across the tube where they are.
  const stripes = useMemo(() => {
    if (!C.stripes) return null;
    const S = lay.spine;
    const backs = S.map((b, i) => {
      const dir = new THREE.Vector3(...S[Math.min(i + 1, S.length - 1)].at).sub(new THREE.Vector3(...S[Math.max(i - 1, 0)].at));
      return { at: b.at, turn: along(dir), geo: new THREE.TorusGeometry(b.r * 1.06, 0.03, 6, 20, Math.PI) };
    });
    const ring = new THREE.TorusGeometry(C.tail.radius + 0.004, 0.018, 6, 14);
    const rings = [0.3, 0.52, 0.74].map((u) => ({ at: tailCurve.getPointAt(u).toArray(), turn: along(tailCurve.getTangentAt(u)) }));
    return { backs, ring, rings };
  }, [C.stripes, lay, tailCurve, C.tail.radius]);
  useEffect(() => () => { stripes?.backs.forEach((b) => b.geo.dispose()); stripes?.ring.dispose(); }, [stripes]);

  // The swish: the whole tail turned about its root, side to side.
  const tail = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    if (tail.current) tail.current.rotation.y = Math.sin(clock.current * 2.6) * 0.5 * C.swish * lay.tail.sway;
  });

  const head = new THREE.Vector3(...lay.head);
  const fur = unlitMat(paint.fur);
  const belly = unlitMat(paint.belly);
  const markings = unlitMat(paint.markings);
  const muzzle = head.clone().add(new THREE.Vector3(0, -0.08, H.radius * 0.84));
  const earBase = 0.12;
  const earHeight = 0.28;
  return (
    <group scale={C.size}>
      {/* The lump: head, body and legs, one form. */}
      <mesh geometry={lump} castShadow receiveShadow material={fur} />
      {/* The chest: a lighter patch pressed onto the front. */}
      {lay.chest && (
        <mesh position={lay.chest.at} scale={lay.chest.scale} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[lay.chest.r, 16, 12]} />
        </mesh>
      )}
      {/* Stripes over the back, on a tabby. */}
      {stripes?.backs.map((b, i) => (
        <mesh key={i} geometry={b.geo} position={b.at} rotation={b.turn} castShadow material={markings} />
      ))}
      {/* Socks: a foot again, a hair bigger, in white, on a tuxedo. */}
      {C.paws &&
        lay.feet.map((at, i) => (
          <mesh key={i} position={at} castShadow material={belly}>
            <sphereGeometry args={[L.radius + 0.012, 12, 8]} />
          </mesh>
        ))}
      {/* The face, on the head. */}
      <group position={lay.head}>
        {/* Ears: four-sided cones turned so a face looks forward, with
            a smaller pink cone pushed forward out of that face. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.17, H.radius * 0.84, -0.02]} rotation-z={-s * 0.3}>
            <mesh rotation-y={Math.PI / 4} castShadow receiveShadow material={fur}>
              <coneGeometry args={[earBase, earHeight, 4]} />
            </mesh>
            <mesh position={[0, -0.04, 0.075]} rotation-y={Math.PI / 4} castShadow material={unlitMat(paint.ear)}>
              <coneGeometry args={[earBase * 0.55, earHeight * 0.6, 4]} />
            </mesh>
          </group>
        ))}
        {/* The muzzle bump, in the belly colour, and the nose on it. */}
        <mesh position={[0, -0.08, H.radius * 0.84]} castShadow receiveShadow material={belly}>
          <sphereGeometry args={[0.14, 16, 12]} />
        </mesh>
        <mesh position={[0, -0.03, H.radius * 0.84 + 0.125]} castShadow material={unlitMat(paint.nose)}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
        {/* Eyes: a dark bead with the iris set in its front. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.12, 0.05, H.radius * 0.96]}>
            <mesh castShadow material={unlitMat(paint.pupil)}>
              <sphereGeometry args={[0.05, 12, 8]} />
            </mesh>
            <mesh position-z={0.025} material={unlitMat(paint.eyes)}>
              <sphereGeometry args={[0.035, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Whiskers: three hair-thin cylinders a side, fanned, from the
          sides of the muzzle. */}
      {[-1, 1].map((s) =>
        FANS.map((fan, i) => {
          const at = whiskerDir(s, fan).multiplyScalar(0.22).add(muzzle).add(new THREE.Vector3(s * 0.08, 0, 0));
          return (
            <mesh key={`${s}${i}`} position={at.toArray()} rotation={whiskerTurn(s, fan)} material={belly}>
              <cylinderGeometry args={[0.006, 0.006, 0.42, 4]} />
            </mesh>
          );
        }),
      )}
      {/* The tail, turned at its root by the swish. */}
      <group ref={tail} position={lay.tail.root}>
        <mesh geometry={tailGeo} castShadow receiveShadow material={fur} />
        {stripes?.rings.map((r, i) => (
          <mesh key={i} geometry={stripes.ring} position={r.at} rotation={r.turn} castShadow material={markings} />
        ))}
        <mesh position={lay.tail.points[lay.tail.points.length - 1]} castShadow material={fur}>
          <sphereGeometry args={[C.tail.radius, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}
