import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { PERCHED_BIRD } from "./objects.js";

// Where the bar the bird grips is, before the bird's size: its top, at
// `height`, and its radius, which the toes wrap round.
const barOf = (C) => (C.perch === "branch" ? C.branch.radius * 0.8 : C.stand.bar);

// How tall the bird is from its feet to the top of its head, before its size.
const birdTallOf = (B) => B.leg.length + B.body * 1.1 + B.body * 0.9 + B.head;

// How tall it stands off its ground: the top of the bird's head.
export function perchedBirdHeightOf(C) {
  return C.height + birdTallOf(C.bird) * C.bird.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// stand's base, or the mound.
export function perchedBirdFootprintOf(C) {
  if (C.perch !== "branch") {
    const r = Math.max(C.stand.base, C.stand.reach / 2);
    return { x: r, z: r };
  }
  // the mound sits off to one side, at the leaning branch's root
  const R = C.branch;
  return { x: R.mound + Math.sin(R.lean) * (C.height / Math.cos(R.lean)), z: R.mound };
}

// The tail as a trapezoid, narrow at its root and widest at its tip,
// extruded thin, in the xy plane with its length along +y.
function tailShape(length, width) {
  const s = new THREE.Shape();
  s.moveTo(-width * 0.25, 0);
  s.lineTo(width * 0.25, 0);
  s.lineTo(width / 2, length);
  s.lineTo(-width / 2, length);
  s.closePath();
  return s;
}

// A smooth pseudo-random in 0..1 from a count, the same every time, so a
// bird looks about the same way in every picture of it.
const hash = (n) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// The small bird itself, its feet at y = 0 gripping a bar of `bar` radius
// along x, facing +z.
function Bird({ B, P, bar, tilt, look }) {
  const tail = useMemo(() => new THREE.ExtrudeGeometry(tailShape(B.tail.length, B.tail.width), { depth: 0.03, bevelEnabled: false }), [B.tail.length, B.tail.width]);
  useEffect(() => () => tail.dispose(), [tail]);

  // Now and then the head turns to one side, eases there, and holds a
  // while, as far as `look` lets it; the cock of the head is `tilt`.
  const head = useRef();
  const turn = useRef({ t: 0, yaw: 0, target: 0, next: 1.6, n: 0 });
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = turn.current;
    s.t += dt;
    if (s.t > s.next) {
      s.n += 1;
      s.target = (hash(s.n) - 0.5) * 1.3 * look;
      s.next = s.t + 1.2 + hash(s.n + 100) * 2.4;
    }
    s.yaw += (s.target * look - s.yaw) * Math.min(1, dt * 7);
    if (head.current) {
      head.current.rotation.y = s.yaw;
      head.current.rotation.z = tilt * 0.45;
    }
  });

  const bodyY = B.leg.length + B.body * 1.0;
  const headY = bodyY + B.body * 0.95;
  const headZ = B.body * 0.45;
  return (
    <group>
      {/* the legs down to the bar, and toes gripping over it */}
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * B.body * 0.35}>
          <mesh position-y={B.leg.length / 2 + bar * 0.3} castShadow material={unlitMat(P.leg)}>
            <cylinderGeometry args={[B.leg.radius, B.leg.radius, B.leg.length + bar * 0.6, 8]} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * B.leg.radius * 1.4, -bar, 0]} rotation-y={Math.PI / 2} castShadow material={unlitMat(P.leg)}>
              <torusGeometry args={[bar + B.leg.radius * 0.8, B.leg.radius * 0.7, 6, 10, Math.PI * 1.2]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the body, a plump ball leaning forward, its belly a paler ball set into its front */}
      <group position-y={bodyY} rotation-x={-B.pitch}>
        <mesh scale={[1, 1.1, 1.25]} castShadow receiveShadow material={unlitMat(P.body)}>
          <sphereGeometry args={[B.body, 24, 16]} />
        </mesh>
        <mesh position={[0, -B.body * 0.12, B.body * 0.22]} scale={[0.9, 0.95, 1.1]} castShadow receiveShadow material={unlitMat(P.belly)}>
          <sphereGeometry args={[B.body * 0.95, 24, 16]} />
        </mesh>
        {/* the wings, flattened against either side, sloping down to the back */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * B.body * 0.82, B.body * 0.15, -B.body * 0.15]} rotation={[0.35, 0, s * -0.25]} scale={[0.32, 0.75, 1.15]} castShadow receiveShadow material={unlitMat(P.body)}>
            <sphereGeometry args={[B.wing, 16, 12]} />
          </mesh>
        ))}
        {/* the fan tail, out and down from the back */}
        <mesh geometry={tail} position={[0, B.body * 0.1, -B.body * 1.0]} rotation-x={-(Math.PI / 2 + B.tail.droop - B.pitch)} castShadow receiveShadow material={unlitMat(P.body)} />
      </group>
      {/* the head: a ball, a cone beak, bead eyes; it cocks and turns */}
      <group ref={head} position={[0, headY, headZ]}>
        <mesh castShadow receiveShadow material={unlitMat(P.body)}>
          <sphereGeometry args={[B.head, 24, 16]} />
        </mesh>
        <mesh position={[0, -B.head * 0.1, B.head * 0.85 + B.beak.length / 2]} rotation-x={Math.PI / 2} castShadow receiveShadow material={unlitMat(P.beak)}>
          <coneGeometry args={[B.beak.radius, B.beak.length, 10]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * B.head * 0.55, B.head * 0.2, B.head * 0.75]} castShadow material={unlitMat(P.eye)}>
            <sphereGeometry args={[B.eye, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// One bird on its perch, standing on the ground at y = 0 facing +z.
// `config` overrides any of PERCHED_BIRD's fields for this one instance.
export default function PerchedBird({ config }) {
  const C = useMemo(() => merge(PERCHED_BIRD, config), [config]);
  const B = C.bird;
  const P = C.colors;
  const bar = barOf(C);
  const branch = C.perch === "branch";
  const R = C.branch;
  // the branch leans back and up from the mound to the bird; its length
  // puts its tip at `height`
  const branchLength = (C.height - R.rise * 0.6) / Math.cos(R.lean);
  const tipX = -Math.sin(R.lean) * branchLength;
  return (
    <group>
      {!branch && (
        <group>
          <mesh position-y={C.stand.plinth / 2} castShadow receiveShadow material={unlitMat(P.perch)}>
            <cylinderGeometry args={[C.stand.base, C.stand.base * 1.08, C.stand.plinth, 24]} />
          </mesh>
          <mesh position-y={C.height / 2} castShadow receiveShadow material={unlitMat(P.perch)}>
            <cylinderGeometry args={[C.stand.post, C.stand.post * 1.2, C.height, 12]} />
          </mesh>
          <mesh position-y={C.height - bar} rotation-z={Math.PI / 2} castShadow receiveShadow material={unlitMat(P.perch)}>
            <cylinderGeometry args={[bar, bar, C.stand.reach, 12]} />
          </mesh>
        </group>
      )}
      {branch && (
        <group>
          {/* the branch grows from the mound's middle up to where the bird sits; both are shifted so the bird is over the middle */}
          <group position-x={-tipX}>
            <mesh position-y={0} scale={[1, R.rise / R.mound, 1]} castShadow receiveShadow material={unlitMat(P.perch)}>
              <sphereGeometry args={[R.mound, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <group position-y={R.rise * 0.6} rotation-z={R.lean}>
              <mesh position-y={branchLength / 2} castShadow receiveShadow material={unlitMat(P.perch)}>
                <cylinderGeometry args={[R.radius * 0.8, R.radius, branchLength, 10]} />
              </mesh>
              <group position-y={branchLength * 0.55} rotation-z={-0.9}>
                <mesh position-y={R.twig / 2} castShadow receiveShadow material={unlitMat(P.perch)}>
                  <cylinderGeometry args={[R.radius * 0.35, R.radius * 0.6, R.twig, 8]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}
      <group position-y={C.height} scale={B.size}>
        <Bird B={B} P={P} bar={bar} tilt={C.tilt} look={C.look} />
      </group>
    </group>
  );
}
