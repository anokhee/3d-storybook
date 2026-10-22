import { useFrame } from "@react-three/fiber";

import { litMat } from "../lit/material.js";
import Glow from "../lit/Glow.jsx";
import { clock, glowSwatch } from "./material.js";

// The one clock every glowing thing breathes by, wound once a frame. Mount
// it once in the world; the materials read it as a shared uniform, so
// nothing else needs to know the time.
export default function GlowingClock() {
  useFrame((s) => {
    clock.value = s.clock.elapsedTime;
  });
  return null;
}

// The bulb inside a glowing thing: a small lit ball in the light's color,
// with its halo, sat at the middle of a thing `radius` big. `L` is the
// resolved light (see lightOf): `showBulb` says whether it is drawn at all,
// `bulb` the ball's radius as a share of the thing's.
export function Bulb({ swatch, radius, light: L }) {
  const r = radius * (L.bulb ?? 0);
  if (!L.showBulb || !(r > 0)) return null;
  const color = glowSwatch(L, swatch);
  return (
    <group>
      <mesh material={litMat(color)}>
        <sphereGeometry args={[r, 12, 8]} />
      </mesh>
      <Glow swatch={color} radius={r} light={L} />
    </group>
  );
}
