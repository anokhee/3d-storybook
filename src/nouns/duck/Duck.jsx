import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { DUCK } from "./objects.js";

// Where the body's middle sits off the ground: on its legs, or, for a
// rubber duck, flat on its belly.
const bodyLiftOf = (C) => {
  const half = (C.body.radius * C.body.height) / 2 + C.body.radius / 2;
  return (C.kind === "rubber" ? 0 : C.leg.height) + half;
};

// How tall the duck stands, before `size`: the top of its head.
const headTopOf = (C) => bodyLiftOf(C) + C.head.lift + C.head.radius;

// How tall it stands off its ground.
export function duckHeightOf(C) {
  return headTopOf(C) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// body's half-length, and the bill out in front of it.
export function duckFootprintOf(C) {
  const B = C.body;
  return {
    x: B.radius * C.size,
    z: Math.max((B.radius * B.length) / 2, C.head.forward + C.head.radius + C.bill.depth) * C.size,
  };
}

// One duck, standing on the ground at y = 0 facing +z. `config` overrides
// any of DUCK's fields for this one instance.
export default function Duck({ config }) {
  const C = useMemo(() => merge(DUCK, config), [config]);
  const B = C.body;
  const H = C.head;
  const L = C.leg;
  const P = C.colors;
  const rubber = C.kind === "rubber";
  const lift = bodyLiftOf(C);
  const bodyHalf = (B.radius * B.height) / 2 + B.radius / 2;

  // The head bobs, the tail waggles, both as much as `bob` says. The rest
  // pose (bob 0, or the first frame) is the duck as drawn.
  const head = useRef();
  const tail = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const t = clock.current;
    const b = C.bob;
    if (head.current) {
      head.current.position.y = lift + H.lift + Math.sin(t * 3.2) * 0.025 * b;
      head.current.rotation.x = Math.sin(t * 3.2 + 0.6) * 0.14 * b;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 9) * 0.35 * b;
  });

  // The eyes, bill and ring hang off the head, so they bob with it; the
  // bill sits a hair below the head's middle, where a bill is.
  const eyeY = H.radius * 0.2;
  const eyeZ = H.radius * 0.72;
  const footZ = L.radius + L.foot.reach * 0.3;
  return (
    <group scale={C.size}>
      {/* the body, a sphere stretched along the duck and pressed down */}
      <mesh position-y={lift} scale={[1, B.height, B.length]} castShadow receiveShadow material={unlitMat(P.body)}>
        <sphereGeometry args={[B.radius, 24, 16]} />
      </mesh>
      {/* the tail, a cone at the back pointing up and back, waggling about its root */}
      <group ref={tail} position={[0, lift + bodyHalf * 0.45, -B.radius * B.length * 0.42]}>
        <mesh position-y={B.tail.height * 0.3} rotation-x={-0.95} castShadow receiveShadow material={unlitMat(P.body)}>
          <coneGeometry args={[B.tail.radius, B.tail.height, 12]} />
        </mesh>
      </group>
      {/* the wings, half-spheres flattened against either side */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * B.radius * 0.72, lift + bodyHalf * 0.1, -B.radius * 0.05]} scale={[C.wing.thin, 0.8, 1.15]}>
          <mesh rotation-y={(s * Math.PI) / 2} castShadow receiveShadow material={unlitMat(P.body)}>
            <sphereGeometry args={[C.wing.radius, 16, 12, 0, Math.PI]} />
          </mesh>
        </group>
      ))}
      {/* the neck, a short cylinder from the body up into the head */}
      <mesh position={[0, lift + H.lift * 0.5, H.forward]} castShadow receiveShadow material={unlitMat(P.head)}>
        <cylinderGeometry args={[H.neck, H.neck * 1.3, H.lift, 16]} />
      </mesh>
      {C.kind === "mallard" && (
        <mesh position={[0, lift + H.lift * 0.5, H.forward]} castShadow receiveShadow material={unlitMat(P.ring)}>
          <cylinderGeometry args={[H.neck * 1.12, H.neck * 1.2, H.lift * 0.25, 16]} />
        </mesh>
      )}
      {/* the head and everything on it */}
      <group ref={head} position={[0, lift + H.lift, H.forward]}>
        <mesh castShadow receiveShadow material={unlitMat(P.head)}>
          <sphereGeometry args={[H.radius, 24, 16]} />
        </mesh>
        {/* the bill, a flat rounded slab out from the face: a capsule laid across and stretched forward */}
        <mesh
          position={[0, -H.radius * 0.12, H.radius * 0.7 + C.bill.depth / 2]}
          rotation-z={Math.PI / 2}
          scale={[1, 1, C.bill.depth / C.bill.thickness]}
          castShadow
          receiveShadow
          material={unlitMat(P.bill)}
        >
          <capsuleGeometry args={[C.bill.thickness / 2, C.bill.width - C.bill.thickness, 4, 12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * C.eye.apart) / 2, eyeY, eyeZ]} castShadow material={unlitMat(P.eye)}>
            <sphereGeometry args={[C.eye.radius, 12, 8]} />
          </mesh>
        ))}
      </group>
      {/* the legs and webbed feet, none on a rubber duck */}
      {!rubber &&
        [-1, 1].map((s) => (
          <group key={s} position={[(s * L.apart) / 2, 0, 0.02]}>
            <mesh position-y={L.height / 2 + 0.05} castShadow receiveShadow material={unlitMat(P.foot)}>
              <cylinderGeometry args={[L.radius, L.radius, L.height + 0.1, 10]} />
            </mesh>
            <mesh position={[0, L.foot.thick / 2, footZ]} scale={[0.85, 1, 1.25]} castShadow receiveShadow material={unlitMat(P.foot)}>
              <cylinderGeometry args={[L.foot.reach, L.foot.reach, L.foot.thick, 3]} />
            </mesh>
          </group>
        ))}
    </group>
  );
}
