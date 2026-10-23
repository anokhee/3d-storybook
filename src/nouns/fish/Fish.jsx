import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { FISH } from "./objects.js";

// Where the belly's top edge runs round the body, as a sphere's theta.
const BELLY_TOP = Math.PI * 0.62;

// The body's half-sizes: across (x), up (y) and along (z).
const halvesOf = (C) => {
  const B = C.body;
  return [B.radius * B.width, B.radius * B.height, B.radius * B.length];
};

// How tall it floats off its ground: the top of the body, the dorsal fin
// standing a little above it.
export function fishHeightOf(C) {
  const [, hy] = halvesOf(C);
  return (C.hover + hy * 2 + C.fin.dorsal.height * 0.6) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// body's half-length, and the tail behind it.
export function fishFootprintOf(C) {
  const [hx, , hz] = halvesOf(C);
  return { x: (hx + C.fin.side.length) * C.size, z: (hz + C.tail.length) * C.size };
}

// One fish, swimming above the ground at y = 0 facing +z. `config`
// overrides any of FISH's fields for this one instance.
export default function Fish({ config }) {
  const C = useMemo(() => merge(FISH, config), [config]);
  const [hx, hy, hz] = halvesOf(C);
  const P = C.colors;
  const T = C.tail;
  const D = C.fin.dorsal;
  const S = C.fin.side;
  const mid = C.hover + hy;

  // The mouth, as the steel drums' fish wear it: two lips, thin lines with
  // round ends a hair proud of the skin, curving round the nose along where
  // the belly meets the body. The bottom lip lies along the belly's top
  // edge, the top lip just above it, `gap` up (in theta) so they touch.
  const lips = useMemo(() => {
    const L = C.lips;
    const at = (phi, lift) => {
      const th = BELLY_TOP - lift;
      const r = 1 + L.thick / hy;
      return new THREE.Vector3(-Math.cos(phi) * Math.sin(th) * hx * r, Math.cos(th) * hy * r, Math.sin(phi) * Math.sin(th) * hz * r);
    };
    const from = Math.PI * (0.5 - L.across / 2);
    return [0, L.gap].map((lift) => ({
      geo: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => at(from + (Math.PI * L.across * i) / 8, lift))),
        24,
        L.thick,
        8,
      ),
      ends: [at(from, lift), at(Math.PI - from, lift)],
    }));
  }, [C.lips, hx, hy, hz]);

  // The swim: the tail beats side to side and the body swings the other
  // way about its middle, so it wiggles; the side fins paddle and the whole
  // fish bobs, nose dipping a little ahead of the rise. The rest pose
  // (swim 0, or the first frame) is the fish as drawn.
  const fish = useRef();
  const tail = useRef();
  const fins = useRef([]);
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt * C.speed;
    const t = clock.current;
    const a = C.swim;
    if (fish.current) {
      fish.current.position.y = mid + Math.sin(t * 1.6) * 0.05 * a;
      fish.current.rotation.x = Math.sin(t * 1.6 - 1.2) * 0.06 * a;
      fish.current.rotation.y = Math.sin(t * 6 + Math.PI) * 0.09 * a;
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * 6 - 0.6) * 0.5 * a;
    fins.current.forEach((fin, i) => {
      if (fin) fin.rotation.z = (i ? -1 : 1) * (0.35 + Math.sin(t * 4 + i * Math.PI) * 0.35 * a);
    });
  });

  // The eyes sit on the body's surface, up on the head either side; dir is
  // where, as a point on the unit sphere before it is stretched.
  const eyeDir = [0.8, 0.22, 0.56];
  return (
    <group scale={C.size}>
      <group ref={fish} position-y={mid}>
        {/* the body, an egg stretched along the fish */}
        <mesh scale={[hx, hy, hz]} castShadow receiveShadow material={unlitMat(P.body)}>
          <sphereGeometry args={[1, 32, 20]} />
        </mesh>
        {/* the belly, the lower part of the egg a hair outside it, paler */}
        <mesh scale={[hx * 1.01, hy * 1.01, hz * 1.01]} receiveShadow material={unlitMat(P.belly)}>
          <sphereGeometry args={[1, 32, 10, 0, Math.PI * 2, BELLY_TOP, Math.PI - BELLY_TOP]} />
        </mesh>
        {/* the lips, a bottom and a top line with round ends */}
        {lips.map((lip, i) => (
          <group key={i}>
            <mesh geometry={lip.geo} castShadow material={unlitMat(P.lips)} />
            {lip.ends.map((p, j) => (
              <mesh key={j} position={p} material={unlitMat(P.lips)}>
                <sphereGeometry args={[C.lips.thick, 8, 6]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* the eyes, white beads with a black bead of a pupil looking out to the side */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * hx * eyeDir[0], hy * eyeDir[1], hz * eyeDir[2]]}>
            <mesh material={unlitMat(P.eye)}>
              <sphereGeometry args={[C.eye.radius, 14, 10]} />
            </mesh>
            <mesh position={[s * C.eye.radius * 0.62, C.eye.radius * 0.1, C.eye.radius * 0.45]} material={unlitMat(P.pupil)}>
              <sphereGeometry args={[C.eye.radius / 2, 10, 8]} />
            </mesh>
          </group>
        ))}
        {/* the dorsal fin, a flat leaf half sunk into its back, raked toward the tail */}
        <mesh position={[0, hy * 0.92, -hz * 0.12]} rotation-x={-0.25} scale={[0.025, D.height, D.length / 2]} castShadow material={unlitMat(P.fin)}>
          <sphereGeometry args={[1, 16, 10]} />
        </mesh>
        {/* the side fins, paddles behind the eyes, hinged at their roots */}
        {[-1, 1].map((s, i) => (
          <group key={s} ref={(el) => (fins.current[i] = el)} position={[s * hx * 0.9, -hy * 0.25, hz * 0.15]} rotation-y={s * -0.5}>
            <mesh position-x={(s * S.length) / 2} scale={[S.length / 2, 0.02, S.height]} castShadow material={unlitMat(P.fin)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* the tail, two lobes forking up and down behind, beating about the root */}
        <group ref={tail} position-z={-hz * 0.92}>
          {[-1, 1].map((s) => (
            <group key={s} rotation-x={(s * T.spread) / 2}>
              <mesh position-z={-T.length / 2} scale={[0.03, T.width, T.length / 2]} castShadow material={unlitMat(P.fin)}>
                <sphereGeometry args={[1, 16, 10]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
