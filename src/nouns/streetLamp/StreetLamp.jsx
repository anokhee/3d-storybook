import { useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import Primitive from "../primitive/Primitive.jsx";
import { STREET_LAMP } from "./objects.js";

// One street lamp — see STREET_LAMP. The ironwork is plain toon shapes; the
// bulb (the lantern's glass, in that style) is a lit Primitive, so it is
// its own colour at any hour with a halo round it, and `glow` hangs a real
// light there to throw on the street.

// Where the light sits, for a caller that wants it (a light-pool decal, a
// moth): off the ground, and out along the arm.
export function streetLampBulbOf(L) {
  const top = L.pole.height;
  if (L.style === "lantern") return [0, top + 0.05 + L.lantern.height / 2, 0];
  return [L.arm.length, top - L.arm.drop - 0.08 - L.arm.shade * 0.5, 0];
}

// The shade's dome is seen from inside too: its own double-sided material.
const domes = new Map();
const domeMat = (swatch) => {
  if (!domes.has(swatch.hex)) domes.set(swatch.hex, toon(hue(swatch), { side: THREE.DoubleSide }));
  return domes.get(swatch.hex);
};

const Cyl = ({ at, r0, r1, h, color, segs = 16, rot }) => (
  <mesh position={at} rotation={rot} material={unlitMat(color)} castShadow receiveShadow>
    <cylinderGeometry args={[r1, r0, h, segs]} />
  </mesh>
);

export default function StreetLamp({ config }) {
  const L = useMemo(() => merge(STREET_LAMP, config), [config]);
  const { base: B, pole: P, arm: A, lantern: N, bulb } = L;
  const post = L.colors.post;
  const top = P.height;
  const bulbAt = streetLampBulbOf(L);
  return (
    <group>
      {/* the plinth and its collar, the post tapering up from it */}
      <Cyl at={[0, B.height / 2, 0]} r0={B.radius} r1={B.radius * 0.85} h={B.height} color={post} />
      <Cyl at={[0, B.height + 0.03, 0]} r0={B.radius * 0.7} r1={B.radius * 0.6} h={0.06} color={post} />
      <Cyl at={[0, (B.height + top) / 2, 0]} r0={P.radius} r1={P.radius * P.taper} h={top - B.height} color={post} segs={12} />

      {L.style === "lantern" ? (
        <group position-y={top}>
          {/* a cup under the lantern, the glass, the cap and its ball */}
          <Cyl at={[0, 0.02, 0]} r0={P.radius * P.taper} r1={N.radius * 0.9} h={0.08} color={post} />
          <group position-y={0.05 + N.height / 2}>
            <Primitive shape="cylinder" radius={N.radius} form={{ tall: N.height / (2 * N.radius) }} swatch={L.colors.bulb} light={bulb.light} />
          </group>
          {[0, 1, 2, 3].map((i) => {
            const th = (i * Math.PI) / 2 + Math.PI / 4;
            return <Cyl key={i} at={[Math.cos(th) * N.radius, 0.05 + N.height / 2, Math.sin(th) * N.radius]} r0={0.012} r1={0.012} h={N.height} color={post} segs={6} />;
          })}
          <Cyl at={[0, 0.07 + N.height + 0.12, 0]} r0={N.radius * N.cap} r1={0.02} h={0.24} color={post} />
          <mesh position={[0, 0.07 + N.height + 0.27, 0]} material={unlitMat(post)} castShadow>
            <sphereGeometry args={[0.045, 12, 10]} />
          </mesh>
        </group>
      ) : (
        <group position-y={top}>
          {/* a ball on the top of the post, the arm out along +x with a
              brace under it, the dome of a shade hung from its end */}
          <mesh material={unlitMat(post)} castShadow>
            <sphereGeometry args={[P.radius * 1.1, 12, 10]} />
          </mesh>
          <Cyl at={[A.length / 2, -A.drop / 2, 0]} rot={[0, 0, Math.PI / 2 - Math.atan2(A.drop, A.length)]} r0={A.radius} r1={A.radius} h={Math.hypot(A.length, A.drop)} color={post} segs={8} />
          <Cyl at={[A.length * 0.22, -0.18, 0]} rot={[0, 0, -Math.PI / 4]} r0={A.radius * 0.7} r1={A.radius * 0.7} h={0.42} color={post} segs={6} />
          <group position={[A.length, -A.drop, 0]}>
            <Cyl at={[0, -0.04, 0]} r0={0.025} r1={0.025} h={0.08} color={post} segs={6} />
            <mesh position-y={-0.08 - A.shade * 0.6} scale={[1, 0.6, 1]} material={domeMat(post)} castShadow>
              {/* a dome, open underneath (the top half of a sphere, both
                  faces drawn so its inside shows from below), squashed */}
              <sphereGeometry args={[A.shade, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
          <group position={[A.length, bulbAt[1] - top, 0]}>
            <Primitive shape="sphere" radius={bulb.radius} swatch={L.colors.bulb} light={bulb.light} />
          </group>
        </group>
      )}

      {/* (under the arm's shade, not in it: in it, it floods the dome) */}
      {L.glow && L.glow.intensity > 0 && (
        <pointLight position={L.style === "arm" ? [bulbAt[0], bulbAt[1] - 0.3, bulbAt[2]] : bulbAt} color={hue(L.colors.bulb)} intensity={L.glow.intensity} distance={L.glow.distance} decay={2} />
      )}
    </group>
  );
}
