import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { HOT_AIR_BALLOON } from "./objects.js";

// How tall it stands off its ground: the basket, the ropes and the
// envelope stacked.
export function hotAirBalloonHeightOf(B) {
  return B.basket.height + B.ropes.length + B.envelope.height;
}

// How far out from its middle it spreads: the envelope's belly.
export function hotAirBalloonFootprintOf(B) {
  const r = Math.max(B.envelope.belly, B.basket.width / 2);
  return { x: r, z: r, round: true };
}

const UP = new THREE.Vector3(0, 1, 0);

// The quaternion that stands a cylinder (built along y) from `a` to `b`,
// and how long it has to be.
function alongOf(a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const length = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
  return { q, length, mid: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5) };
}

// One hot air balloon, standing on the ground at y = 0 on its basket.
// `config` overrides any of HOT_AIR_BALLOON's fields for this one instance.
export default function HotAirBalloon({ config }) {
  const B = useMemo(() => merge(HOT_AIR_BALLOON, config), [config]);
  const E = B.envelope;
  const K = B.basket;
  const R = B.ropes;
  const U = B.burner;
  const paint = B.colors;

  const gores = Math.max(2, Math.round(E.gores));
  // The envelope as `gores` wedges of one lathe, each its own mesh so it
  // takes its own colour. The profile's first point is the neck.
  const wedges = useMemo(() => {
    const pts = E.profile.map(([x, y], i) =>
      new THREE.Vector2((i === 0 ? E.neck : x) * E.belly, y * E.height),
    );
    const phi = (Math.PI * 2) / gores;
    return Array.from({ length: gores }, (_, i) =>
      new THREE.LatheGeometry(pts, Math.max(1, Math.round(E.segments)), i * phi, phi),
    );
  }, [E.profile, E.neck, E.belly, E.height, E.segments, gores]);
  useEffect(() => () => wedges.forEach((g) => g.dispose()), [wedges]);

  const rope = useMemo(() => new THREE.CylinderGeometry(R.radius, R.radius, 1, 6), [R.radius]);
  useEffect(() => () => rope.dispose(), [rope]);

  // The ropes run from in from the basket's corners up to the neck's rim,
  // at the four quarters round it.
  const neck = E.neck * E.belly;
  const ropes = useMemo(() => {
    const inset = K.width / 2 - R.spread;
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([x, z]) => {
      const a = new THREE.Vector3(x * inset, 0, z * inset);
      const b = new THREE.Vector3(x * neck * 0.72, R.length, z * neck * 0.72);
      return alongOf(a, b);
    });
  }, [K.width, R.spread, R.length, neck]);

  // The envelope and its ropes rock as one about where the ropes tie on,
  // so the basket keeps still on the ground.
  const sway = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt * B.rate;
    const t = clock.current;
    if (!sway.current) return;
    const s = B.sway * 0.06;
    sway.current.rotation.z = s * Math.sin(t * 2.1);
    sway.current.rotation.x = s * 0.7 * Math.sin(t * 1.5 + 1);
  });

  const rimAt = K.height - K.rim / 2;
  return (
    <group>
      {/* The basket: a wicker box, with a darker band proud round its top. */}
      <group position-y={K.height / 2}>
        <mesh material={unlitMat(paint.basket)} castShadow receiveShadow>
          <boxGeometry args={[K.width, K.height, K.width]} />
        </mesh>
      </group>
      <group position-y={rimAt}>
        <mesh material={unlitMat(paint.rim)} castShadow receiveShadow>
          <boxGeometry args={[K.width + 0.08, K.rim, K.width + 0.08]} />
        </mesh>
      </group>
      <group position-y={K.height} ref={sway}>
        {ropes.map((r, i) => (
          <mesh
            key={i}
            geometry={rope}
            position={r.mid}
            quaternion={r.q}
            scale={[1, r.length, 1]}
            material={unlitMat(paint.rope)}
            castShadow
          />
        ))}
        {/* The burner, hung in the neck a little below the envelope's
            opening, its flame lit above it. */}
        <group position-y={R.length - U.height * 1.6}>
          <mesh material={unlitMat(paint.burner)} castShadow>
            <cylinderGeometry args={[U.radius, U.radius * 0.8, U.height, 10]} />
          </mesh>
          <group position-y={U.height / 2 + U.flame}>
            <Primitive
              shape="sphere"
              radius={U.flame}
              detail={0.6}
              form={{ tall: 1.5 }}
              swatch={paint.flame}
              light={{ type: "lit", brightness: 0.6 }}
            />
            {U.glow && (
              <pointLight
                color={hue(paint.flame)}
                intensity={U.glow.intensity}
                distance={U.glow.distance}
                decay={2}
              />
            )}
          </group>
        </group>
        {/* The envelope casts but takes no shadow: a shell this big
            over itself only speckles under the shadow map. */}
        <group position-y={R.length}>
          {wedges.map((g, i) => (
            <mesh
              key={i}
              geometry={g}
              material={unlitMat(i % 2 ? paint.goreB : paint.goreA)}
              castShadow
            />
          ))}
        </group>
      </group>
    </group>
  );
}
