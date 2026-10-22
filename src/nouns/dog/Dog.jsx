import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { DOG } from "./objects.js";

// Where everything sits for each pose, at size 1. The body is a capsule
// with its axis along y, turned `tilt` about x (0 lies it along z, nose
// end at +z; a positive tilt stands the front end up). Legs are capsules
// standing up unless `lying`, which lays one along z (a tucked hind
// foot). The collar is placed off the head's middle and `lean`ed to sit
// round the neck. The tail is a curve of points relative to its `root`,
// where the wag turns it. `top` is how tall the dog stands, at the head.
function layoutOf(C) {
  const B = C.body;
  const H = C.head;
  const L = C.legs;
  if (C.pose === "sitting") {
    return {
      body: { at: [0, 0.75, -0.05], tilt: Math.PI / 2 - 0.5, length: B.length * 0.7 },
      saddle: { at: [0, 0.82, -0.16] },
      haunches: [[-0.2, 0.32, -0.3], [0.2, 0.32, -0.3]],
      head: [0, 1.4, 0.33],
      collar: { off: [0, -0.3, -0.06], lean: -Math.PI / 2 + 0.3 },
      legs: [
        { at: [-0.2, 0.36, 0.32], length: L.length + 0.18 },
        { at: [0.2, 0.36, 0.32], length: L.length + 0.18 },
        { at: [-0.27, 0.1, 0.1], length: 0.2, lying: true },
        { at: [0.27, 0.1, 0.1], length: 0.2, lying: true },
      ],
      tail: {
        root: [0.08, 0.14, -0.55],
        points: [[0, 0, 0], [0.12, -0.02, -0.25], [0.4, -0.05, -0.38], [0.68, -0.06, -0.3]],
      },
      top: 1.4 + H.radius,
    };
  }
  return {
    body: { at: [0, 0.82, -0.05], tilt: 0, length: B.length },
    saddle: { at: [0, 0.97, -0.1] },
    haunches: [],
    head: [0, 1.28, 0.6],
    collar: { off: [0, -0.22, -0.14], lean: -0.6 },
    legs: [
      { at: [-0.22, 0.27, 0.4], length: L.length },
      { at: [0.22, 0.27, 0.4], length: L.length },
      { at: [-0.22, 0.27, -0.45], length: L.length },
      { at: [0.22, 0.27, -0.45], length: L.length },
    ],
    tail: {
      root: [0, 0.98, -0.74],
      points: [[0, -0.02, 0], [0, 0.1, -0.24], [0, 0.38, -0.34], [0, 0.64, -0.26]],
    },
    top: 1.28 + H.radius,
  };
}

// How tall the dog stands off its ground: the top of its head.
export function dogHeightOf(C) {
  return layoutOf(C).top * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// ears across, nose to tail along.
export function dogFootprintOf(C) {
  return { x: 0.45 * C.size, z: 1.15 * C.size };
}

// One dog, standing on the ground at y = 0 facing +z. `config` overrides
// any of DOG's fields for this one instance.
export default function Dog({ config }) {
  const C = useMemo(() => merge(DOG, config), [config]);
  const lay = useMemo(() => layoutOf(C), [C]);
  const B = C.body;
  const H = C.head;
  const S = C.snout;
  const L = C.legs;
  const paint = C.colors;

  // The tail: a tube along a smooth curve through the pose's points.
  const tailGeo = useMemo(() => {
    const pts = lay.tail.points.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 20, C.tail.radius, 8, false);
  }, [lay, C.tail.radius]);
  useEffect(() => () => tailGeo.dispose(), [tailGeo]);

  // The wag: the whole tail turned about its root, quick, side to side.
  const tail = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    if (tail.current) tail.current.rotation.y = Math.sin(clock.current * 9) * 0.55 * C.wag;
  });

  const coat = unlitMat(paint.coat);
  const patch = unlitMat(paint.patch);
  const snoutZ = H.radius * 0.75 + S.length / 2;
  return (
    <group scale={C.size}>
      {/* The body, and the saddle: the same capsule a shade smaller and
          set higher, so it shows only over the back. */}
      <group position={lay.body.at} rotation-x={lay.body.tilt}>
        <mesh castShadow receiveShadow material={coat}>
          <capsuleGeometry args={[B.radius, lay.body.length, 6, 16]} />
        </mesh>
      </group>
      {C.saddle && (
        <group position={lay.saddle.at} rotation-x={lay.body.tilt}>
          <mesh castShadow receiveShadow material={patch}>
            <capsuleGeometry args={[B.radius * 0.97, lay.body.length * 0.6, 6, 16]} />
          </mesh>
        </group>
      )}
      {lay.haunches.map((at, i) => (
        <mesh key={i} position={at} castShadow receiveShadow material={coat}>
          <sphereGeometry args={[0.32, 16, 12]} />
        </mesh>
      ))}
      {/* Legs: short capsules, their rounded bottoms the paws. */}
      {lay.legs.map((g, i) => (
        <mesh key={i} position={g.at} rotation-x={g.lying ? Math.PI / 2 : 0} castShadow receiveShadow material={coat}>
          <capsuleGeometry args={[L.radius, g.length, 4, 12]} />
        </mesh>
      ))}
      {/* The head and its face. */}
      <group position={lay.head}>
        <mesh castShadow receiveShadow material={coat}>
          <sphereGeometry args={[H.radius, 24, 16]} />
        </mesh>
        {/* The snout: a capsule out front, the nose a dark bead on its end. */}
        <mesh position={[0, -0.1, snoutZ]} rotation-x={Math.PI / 2} castShadow receiveShadow material={coat}>
          <capsuleGeometry args={[S.radius, S.length, 6, 14]} />
        </mesh>
        <mesh position={[0, -0.06, snoutZ + S.length / 2 + S.radius * 0.8]} castShadow material={unlitMat(paint.nose)}>
          <sphereGeometry args={[0.075, 12, 8]} />
        </mesh>
        {/* Ears: flattened capsules hanging from the sides of the head,
            the tops tipped outward so they drape. */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * (H.radius - 0.01), -0.08, -0.06]}
            rotation={[0.12, 0, -s * 0.38]}
            scale={[0.5, 1, 1]}
            castShadow
            receiveShadow
            material={patch}
          >
            <capsuleGeometry args={[0.14, 0.3, 4, 12]} />
          </mesh>
        ))}
        {/* Eyes: dark beads either side above the snout. */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.14, 0.08, H.radius * 0.86]} castShadow material={unlitMat(paint.eyes)}>
            <sphereGeometry args={[0.05, 12, 8]} />
          </mesh>
        ))}
        {/* The collar: a thin ring round the neck, the tag hung from its front. */}
        <group position={lay.collar.off} rotation-x={lay.collar.lean}>
          <mesh castShadow receiveShadow material={unlitMat(paint.collar)}>
            <torusGeometry args={[H.radius * 1.05, 0.045, 8, 24]} />
          </mesh>
          <mesh position={[0, -H.radius * 1.05, 0.05]} castShadow material={unlitMat(paint.tag)}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
          </mesh>
        </group>
      </group>
      {/* The tail, turned at its root by the wag. */}
      <group ref={tail} position={lay.tail.root}>
        <mesh geometry={tailGeo} castShadow receiveShadow material={coat} />
        <mesh position={lay.tail.points[lay.tail.points.length - 1]} castShadow material={coat}>
          <sphereGeometry args={[C.tail.radius, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}
