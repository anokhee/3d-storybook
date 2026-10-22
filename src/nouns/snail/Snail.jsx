import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { SNAIL } from "./objects.js";

// Each turn of the spiral is twice the one before: a logarithmic spiral
// with that growth, r = r0 * 2^(angle / 2pi).
const GROWTH = Math.log(2) / (2 * Math.PI);

// The shell as a tube wound along a logarithmic spiral in the xy plane,
// its radius growing with the spiral's, so the whorl fattens toward the
// mouth the way a shell does. TubeGeometry has one radius, so this is
// made by hand: a ring of `sides` points around every step of the
// spiral, stitched to the next. `offset` pushes the centreline out from
// the spiral's middle (as a share of the tube's radius) for the stripe
// wound along the shell's outside. The mouth, the last and widest ring,
// ends at the bottom (angle -pi/2) so it sits against the foot. The
// coil's middle is pushed out of the plane as it winds in, so the whole
// is a low cone with its spire to one side, not a flat disc.
function spiralTube(across, turns, sides, offset = 0, thin = 1) {
  const end = turns * 2 * Math.PI;
  const rEnd = across * 0.27;
  const tubeEnd = across * 0.23;
  const steps = Math.max(24, Math.round(turns * 28));
  const pos = [];
  const idx = [];
  const spin = -Math.PI / 2 - end; // turns the spiral so its mouth faces down
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * end;
    const grow = Math.pow(2, (a - end) / (2 * Math.PI));
    const r = rEnd * grow;
    const tube = Math.max(0.004, tubeEnd * grow) * thin;
    const shift = tubeEnd * grow * offset;
    // the spiral's point, and the unit radial out from its middle; the
    // tube's radius grows so the whole thing is a growing horn
    const c = Math.cos(a + spin);
    const s = Math.sin(a + spin);
    const cx = (r + shift) * c;
    const cy = (r + shift) * s;
    const cz = ((end - a) / end) * across * 0.25;
    // the tangent of a logarithmic spiral leans a fixed angle off the radial
    const tx = c * GROWTH - s;
    const ty = s * GROWTH + c;
    const tl = Math.hypot(tx, ty);
    const nx = -ty / tl;
    const ny = tx / tl;
    for (let j = 0; j < sides; j++) {
      const p = (j / sides) * 2 * Math.PI;
      const cp = Math.cos(p);
      const sp = Math.sin(p);
      pos.push(cx + nx * cp * tube, cy + ny * cp * tube, cz + sp * tube);
    }
    if (i > 0) {
      const a0 = (i - 1) * sides;
      const b0 = i * sides;
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides;
        idx.push(a0 + j, b0 + j, b0 + k, a0 + j, b0 + k, a0 + k);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// The foot as a lathe along y, a teardrop fat toward the front and
// tapering to a point at the back, laid along z and pressed flat.
function footProfile(length, radius) {
  const pts = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = radius * 2.1 * Math.pow(t, 0.42) * Math.pow(1 - t, 0.55);
    pts.push(new THREE.Vector2(Math.max(0.001, r), (t - 0.5) * length));
  }
  return pts;
}

// Where the shell's middle sits, before `size`: on the back half of the
// foot, sunk a little into it.
const shellCentreOf = (C) => {
  const S = C.shell;
  return { y: C.foot.radius * C.foot.flat * 2 - S.sink + S.across * 0.42, z: -C.foot.length * 0.08 };
};

// How tall it stands off its ground: the top of the shell, or the tips of
// the eye stalks if those reach higher.
export function snailHeightOf(C) {
  const shell = shellCentreOf(C).y + C.shell.across * 0.5;
  const F = C.foot;
  const eyes = F.radius * F.flat * 2 + F.head.lift + F.head.radius + Math.cos(C.stalks.lean) * C.stalks.length + C.stalks.eye;
  return Math.max(shell, eyes) * C.size;
}

// How far out from its middle it spreads, across (x) and along (z): the
// foot's length, and the shell's width across.
export function snailFootprintOf(C) {
  return { x: Math.max(C.foot.radius, C.shell.across * 0.5) * C.size, z: (C.foot.length / 2) * C.size };
}

// One snail, crawling on the ground at y = 0 facing +z. `config`
// overrides any of SNAIL's fields for this one instance.
export default function Snail({ config }) {
  const C = useMemo(() => merge(SNAIL, config), [config]);
  const F = C.foot;
  const S = C.shell;
  const K = C.stalks;
  const P = C.colors;

  const foot = useMemo(() => new THREE.LatheGeometry(footProfile(F.length, F.radius), 20), [F.length, F.radius]);
  const shell = useMemo(() => spiralTube(S.across, S.turns, 14), [S.across, S.turns]);
  const stripe = useMemo(() => (S.stripe ? spiralTube(S.across, S.turns, 8, 0.92, 0.3) : null), [S.across, S.turns, S.stripe]);
  useEffect(() => () => foot.dispose(), [foot]);
  useEffect(() => () => shell.dispose(), [shell]);
  useEffect(() => () => stripe?.dispose(), [stripe]);

  // The eye stalks wave slowly, each on its own beat, as much as `pace`
  // says; at 0 they stand as drawn.
  const stalks = [useRef(), useRef()];
  const clock = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const t = clock.current;
    stalks.forEach((ref, i) => {
      if (!ref.current) return;
      const s = i ? 1 : -1;
      ref.current.rotation.z = s * 0.2 + Math.sin(t * 1.1 + i * 2.1) * 0.1 * C.pace;
      ref.current.rotation.x = K.lean + Math.sin(t * 0.8 + i * 0.4) * 0.2 * C.pace;
    });
  });

  const footTop = F.radius * F.flat * 2;
  const headY = footTop + F.head.lift;
  const headZ = F.length * 0.42;
  const centre = shellCentreOf(C);
  return (
    <group scale={C.size}>
      {/* the foot, a teardrop laid along z and pressed flat, its point at the back */}
      <group position-y={footTop / 2} scale={[1, F.flat, 1]}>
        <mesh geometry={foot} rotation-x={Math.PI / 2} castShadow receiveShadow material={unlitMat(P.foot)} />
      </group>
      {/* the head end raised at the front, with a neck up to it */}
      <mesh position={[0, (footTop + headY) / 2, headZ - 0.02]} castShadow receiveShadow material={unlitMat(P.foot)}>
        <cylinderGeometry args={[F.head.radius * 0.95, F.head.radius * 1.1, headY - footTop + 0.02, 16]} />
      </mesh>
      <mesh position={[0, headY, headZ]} castShadow receiveShadow material={unlitMat(P.foot)}>
        <sphereGeometry args={[F.head.radius, 20, 14]} />
      </mesh>
      {/* the eye stalks, leaning forward off the top of the head, an eye on each */}
      {[-1, 1].map((s, i) => (
        <group key={s} ref={stalks[i]} position={[(s * K.apart) / 2, headY + F.head.radius * 0.7, headZ]} rotation-x={K.lean} rotation-z={s * 0.2}>
          <mesh position-y={K.length / 2} castShadow receiveShadow material={unlitMat(P.foot)}>
            <cylinderGeometry args={[K.radius, K.radius * 1.3, K.length, 8]} />
          </mesh>
          <mesh position-y={K.length} castShadow receiveShadow material={unlitMat(P.eye)}>
            <sphereGeometry args={[K.eye, 12, 8]} />
          </mesh>
        </group>
      ))}
      {/* the feelers, shorter, pointing forward and down from the face */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * K.apart) / 2, headY - F.head.radius * 0.2, headZ + F.head.radius * 0.8]} rotation-x={1.35} rotation-z={s * 0.35}>
          <mesh position-y={K.feelers.length / 2} castShadow receiveShadow material={unlitMat(P.foot)}>
            <cylinderGeometry args={[K.radius * 0.7, K.radius, K.feelers.length, 8]} />
          </mesh>
        </group>
      ))}
      {/* the shell, its spiral plane upright along the snail with its spire out to -x, swung back by `turn` and leaned over by `tilt` */}
      <group position={[0, centre.y, centre.z]} rotation={[0, -Math.PI / 2 - S.turn, S.tilt, "ZYX"]}>
        <mesh geometry={shell} castShadow receiveShadow material={unlitMat(P.shell)} />
        {stripe && <mesh geometry={stripe} castShadow receiveShadow material={unlitMat(P.stripe)} />}
      </group>
    </group>
  );
}
