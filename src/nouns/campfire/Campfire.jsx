import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { litMat } from "../../adjectives/lit/material.js";
import Glow from "../../adjectives/lit/Glow.jsx";
import Primitive from "../primitive/Primitive.jsx";
import { CAMPFIRE } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// A steady scatter: the same number for the same stone every render, so
// the ring does not reshuffle when a knob moves.
const jitter = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// How tall the fire stands off its ground: the tip of the core flame
// above the logs' crossing.
export function campfireHeightOf(C) {
  return logsTopOf(C) + C.flames.height;
}

// How far out from its middle it spreads: the stone ring's outer edge.
export function campfireFootprintOf(C) {
  const r = C.ring.radius + C.ring.size;
  return { x: r, z: r, round: true };
}

// Where the leant logs cross, off the ground.
const logsTopOf = (C) => C.logs.length * Math.sin(rad(C.logs.lean)) * 0.55;

// A flame's profile, from its foot up to its tip: fat low down, drawn to
// a point above, as a lathe about its own axis.
function flameGeometry(width, height) {
  const pts = [
    [0, 0],
    [0.7, 0.05],
    [1, 0.25],
    [0.85, 0.5],
    [0.5, 0.74],
    [0.18, 0.92],
    [0, 1],
  ].map(([x, y]) => new THREE.Vector2(x * width, y * height));
  return new THREE.LatheGeometry(pts, 12);
}

// How a flicker beats: three sines that never line up, so it never
// settles into a rhythm.
const beat = (t, phase) =>
  0.5 * Math.sin(t + phase) +
  0.3 * Math.sin(t * 1.7 + phase * 2.1) +
  0.2 * Math.sin(t * 2.9 + phase * 0.7);

// One campfire, standing on the ground at y = 0. `config` overrides any of
// CAMPFIRE's fields for this one instance.
export default function Campfire({ config }) {
  const C = useMemo(() => merge(CAMPFIRE, config), [config]);
  const R = C.ring;
  const L = C.logs;
  const F = C.flames;
  const E = C.embers;
  const paint = C.colors;

  const stone = useMemo(() => new THREE.DodecahedronGeometry(R.size, 0), [R.size]);
  const log = useMemo(
    () => new THREE.CylinderGeometry(L.radius, L.radius, L.length, 8),
    [L.radius, L.length],
  );
  const flames = useMemo(
    () => F.tiers.map((t) => flameGeometry(t.width * F.height, t.height * F.height)),
    [F.tiers, F.height],
  );
  useEffect(() => () => stone.dispose(), [stone]);
  useEffect(() => () => log.dispose(), [log]);
  useEffect(() => () => flames.forEach((g) => g.dispose()), [flames]);

  const stones = useMemo(
    () =>
      Array.from({ length: Math.max(0, Math.round(R.stones)) }, (_, i) => {
        const a = (i / Math.max(1, Math.round(R.stones))) * Math.PI * 2 + jitter(i, 1) * 0.25;
        const r = R.radius * (0.94 + 0.12 * jitter(i, 2));
        const s = 0.8 + 0.4 * jitter(i, 3);
        const swatch = [paint.stone, paint.stoneDark, paint.stoneLight][i % 3];
        return {
          pos: [Math.cos(a) * r, R.size * s * 0.62, Math.sin(a) * r],
          scale: [s, s * 0.72, s],
          turn: [jitter(i, 4) * 0.5, jitter(i, 5) * Math.PI, jitter(i, 6) * 0.5],
          swatch,
        };
      }),
    [R, paint.stone, paint.stoneDark, paint.stoneLight],
  );

  const logsTop = logsTopOf(C);
  // A fire burnt low throws less light: the glow falls with the flame
  // once it is under a unit or so tall.
  const glow = C.glow.intensity * Math.min(1, F.height / 1.2);
  const flameRefs = useRef([]);
  const light = useRef();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt * F.rate;
    const t = clock.current;
    const k = F.flicker;
    flameRefs.current.forEach((g, i) => {
      if (!g) return;
      const b = beat(t, i * 1.9);
      g.scale.set(1 - 0.1 * k * b, 1 + 0.22 * k * b, 1 - 0.1 * k * b);
      g.rotation.z = 0.12 * k * beat(t * 0.8, i * 3.3 + 1);
      g.rotation.x = 0.1 * k * beat(t * 0.7, i * 2.4 + 2);
    });
    if (light.current) {
      light.current.intensity = glow * (1 + 0.3 * k * beat(t * 1.3, 0.4));
    }
  });

  const coreRadius = F.tiers[0] ? F.tiers[0].width * F.height : 0.3;
  return (
    <group>
      {stones.map((s, i) => (
        <mesh
          key={i}
          geometry={stone}
          position={s.pos}
          scale={s.scale}
          rotation={s.turn}
          material={unlitMat(s.swatch)}
          castShadow
          receiveShadow
        />
      ))}
      {/* Leant in from their feet, each turned to its own place round the
          middle: a cylinder stands along y, so leaning is a turn about z
          toward the middle, the base kept a hair down in the ground. */}
      {Array.from({ length: L.count }, (_, i) => {
        const a = (i / L.count) * Math.PI * 2 + 0.4;
        const tilt = rad(90 - L.lean);
        const half = L.length / 2;
        return (
          <group key={i} rotation-y={-a}>
            <group
              position={[L.foot - half * Math.sin(tilt), half * Math.cos(tilt) - 0.04, 0]}
              rotation-z={tilt}
            >
              <mesh geometry={log} material={unlitMat(paint.log)} castShadow receiveShadow />
            </group>
          </group>
        );
      })}
      {/* The fire: each flame its own colour from any angle, standing from
          the logs' crossing, and one halo over the core. */}
      <group position-y={logsTop - 0.3}>
        {F.tiers.map((tier, i) => (
          <group
            key={i}
            position={[tier.at[0], 0, tier.at[1]]}
            ref={(el) => (flameRefs.current[i] = el)}
          >
            <mesh geometry={flames[i]} material={litMat(paint[tier.tier] ?? paint.flame)} />
          </group>
        ))}
        <group position-y={F.height * 0.4}>
          <Glow swatch={paint.flameMid} radius={coreRadius} light={{ type: "lit", brightness: 0.6 }} />
        </group>
        <pointLight
          ref={light}
          position-y={F.height * 0.5}
          color={hue(C.glow.color)}
          intensity={glow}
          distance={C.glow.distance}
          decay={2}
        />
      </group>
      {/* Coals at the foot of the logs, lit. */}
      {Array.from({ length: E.count }, (_, i) => {
        const a = (i / E.count) * Math.PI * 2 + jitter(i, 7);
        const r = E.spread * (0.5 + 0.5 * jitter(i, 8));
        return (
          <group key={i} position={[Math.cos(a) * r, E.radius * 0.7, Math.sin(a) * r]}>
            <Primitive
              shape="sphere"
              radius={E.radius}
              detail={0.6}
              swatch={paint.ember}
              light={{ type: "lit", brightness: 0.35 }}
            />
          </group>
        );
      })}
    </group>
  );
}
