import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { JACK_HEAD } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// Where the head's middle stands: on its spring, sunk a little into the
// collar.
const headAt = (C) => C.spring.height + C.head.radius * 0.85;

// How tall it stands, in its own units: to the hat's tip.
export const jackHeadHeightOf = (C) =>
  headAt(C) + C.head.radius * 0.7 + C.hat.height * Math.cos(rad(C.hat.tilt));

// A point on the head's skin in the direction (x, y, z), pushed out `by`.
const skin = (R, [x, y, z], by = 0) =>
  new THREE.Vector3(x, y, z)
    .normalize()
    .multiplyScalar(R + by)
    .toArray();

// One jack-in-the-box clown head (see JACK_HEAD), on its spring at y = 0.
// `config` overrides any of JACK_HEAD's fields.
export default function JackHead({ config }) {
  const C = useMemo(() => merge(JACK_HEAD, config), [config]);
  const S = C.spring;
  const R = C.head.radius;

  const coil = useMemo(() => {
    const per = 18;
    const points = Array.from({ length: S.turns * per + 1 }, (_, i) => {
      const a = (i / per) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(a) * S.radius,
        (i / (S.turns * per)) * S.height,
        Math.sin(a) * S.radius,
      );
    });
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      points.length * 2,
      S.wire,
      6,
    );
  }, [S.turns, S.radius, S.height, S.wire]);
  useEffect(() => () => coil.dispose(), [coil]);

  const smile = useMemo(
    () => new THREE.TorusGeometry(R * 0.4, R * 0.05, 6, 14, Math.PI),
    [R],
  );
  useEffect(() => () => smile.dispose(), [smile]);

  const ball = (radius, swatch, position, scale) => (
    <mesh position={position} scale={scale} material={unlitMat(swatch)}>
      <sphereGeometry args={[radius, 12, 8]} />
    </mesh>
  );
  const H = C.hat;
  const tilt = rad(H.tilt);
  return (
    <group scale={C.scale}>
      <mesh geometry={coil} material={unlitMat(S.color)} />
      <group position-y={headAt(C)}>
        {ball(R, C.head.color, [0, 0, 0])}
        {/* The collar: a ruffled ring at the neck */}
        <mesh
          position-y={-R * 0.8}
          rotation-x={Math.PI / 2}
          material={unlitMat(C.collar)}
        >
          <torusGeometry args={[R * 0.6, R * 0.17, 8, 18]} />
        </mesh>
        {/* Ears */}
        {[-1, 1].map((side) => (
          <group key={side}>
            {ball(
              R * 0.26,
              C.head.color,
              [side * R * 0.97, -R * 0.05, 0],
              [0.5, 1, 1],
            )}
            {ball(
              R * 0.16,
              C.cheek,
              [side * R * 1.02, -R * 0.05, 0],
              [0.4, 1, 0.9],
            )}
          </group>
        ))}
        {/* Tufts of hair, under the hat's brim */}
        {[-1, 1].map((side) =>
          ball(
            R * C.hair.radius * 2.2,
            C.hair.color,
            skin(R, [side * 0.85, 0.42, 0.05], -R * 0.05),
          ),
        )}
        {/* Cheeks, eyes, nose, smile */}
        {[-1, 1].map((side) => (
          <group key={side}>
            {ball(
              R * 0.17,
              C.cheek,
              skin(R, [side * 0.62, -0.18, 0.78], -R * 0.02),
              [1, 1, 0.4],
            )}
            {C.happy ? (
              ball(
                R * 0.09,
                C.feature,
                skin(R, [side * 0.33, 0.2, 0.92], R * 0.0),
              )
            ) : (
              <mesh
                position={skin(R, [side * 0.33, 0.2, 0.92], R * 0.01)}
                rotation-z={0}
                material={unlitMat(C.feature)}
              >
                <torusGeometry args={[R * 0.1, R * 0.025, 5, 10, Math.PI]} />
              </mesh>
            )}
          </group>
        ))}
        {ball(R * 0.14, C.nose, skin(R, [0, -0.02, 1], R * 0.07))}
        <mesh
          geometry={smile}
          position={[0, -R * 0.2, R * 0.86]}
          rotation-z={Math.PI}
          material={unlitMat(C.feature)}
        />
        {/* The hat, tipped, with its pompom */}
        <group position-y={R * 0.78} rotation-z={-tilt}>
          <mesh position-y={H.height / 2} material={unlitMat(H.color)}>
            <coneGeometry args={[H.radius, H.height, 16]} />
          </mesh>
          {ball(H.radius * 0.28, H.pompom, [0, H.height, 0])}
        </group>
      </group>
    </group>
  );
}
